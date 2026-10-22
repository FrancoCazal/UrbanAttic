# Deploy a GCP Compute Engine

Playbook para desplegar Urban Attic en una VM e2-micro (free tier de GCP) con docker-compose, Caddy (TLS automático) y frontend en Vercel.

## Arquitectura final

```
Browser
  |
  v
urbanattic.francocazal.com  (Vercel)        ← Frontend
  |
  | rewrite /api/*  →  https://api.urbanattic.francocazal.com/api/*
  v
api.urbanattic.francocazal.com  (GCP VM)    ← Backend
  └── Caddy :443  (TLS, Let's Encrypt automático)
        └── backend:8000  (gunicorn)
              ├── postgres:5432
              └── redis:6379  ← también broker de Celery
        + celery worker (mismo network)
```

---

## Pre-requisitos

- Cuenta GCP con `gcloud` CLI instalado y autenticado (`gcloud auth login`)
- Proyecto GCP creado y configurado: `gcloud config set project TU-PROJECT-ID`
- Cuenta de facturación **paga** vinculada al proyecto. El free tier exige una cuenta de facturación activa; si es una de prueba, cuando vence el trial se cierra y la VM se pierde.
- Acceso al panel DNS de `francocazal.com`
- Frontend ya en Vercel apuntando a `urbanattic.francocazal.com`

---

## 1. Reservar IP estática

```bash
gcloud compute addresses create urbanattic-ip \
  --region=us-central1
```

Anotá la IP:

```bash
gcloud compute addresses describe urbanattic-ip --region=us-central1 --format='value(address)'
```

> Desde febrero de 2024 GCP cobra la IPv4 externa en uso (US$0,005/h, ~US$3,65/mes) y la documentación del free tier no la incluye. Reservada y sin attachear cuesta más. Revisá el reporte de facturación a los dos días de crear la VM.

---

## 2. Crear la VM

```bash
gcloud compute instances create urbanattic \
  --zone=us-central1-a \
  --machine-type=e2-micro \
  --image-family=debian-12 \
  --image-project=debian-cloud \
  --boot-disk-size=30GB \
  --boot-disk-type=pd-standard \
  --address=urbanattic-ip \
  --tags=http-server,https-server
```

El free tier cubre una `e2-micro` en `us-west1`, `us-central1` o `us-east1` y 30 GB de disco `pd-standard`. Otro tipo de disco (el default es `pd-balanced`) o más de 30 GB se facturan.

Abrir firewall:

```bash
gcloud compute firewall-rules create allow-http-https \
  --allow=tcp:80,tcp:443 \
  --target-tags=http-server,https-server \
  --source-ranges=0.0.0.0/0
```

---

## 3. Configurar DNS

En el panel donde tenés `francocazal.com`, agregá dos records:

| Type  | Name                 | Value                         | TTL  |
|-------|----------------------|-------------------------------|------|
| A     | `api.urbanattic`     | `<IP estática del paso 1>`    | 300  |
| CNAME | `urbanattic`         | `cname.vercel-dns.com`        | 300  |

> El segundo es para que `urbanattic.francocazal.com` resuelva al frontend de Vercel. Si ya lo tenías, dejalo.

Verificá que propaguen (1-15 minutos):

```bash
dig api.urbanattic.francocazal.com +short
dig urbanattic.francocazal.com +short
```

---

## 4. Conectarse a la VM e instalar Docker

```bash
gcloud compute ssh urbanattic --zone=us-central1-a
```

Adentro de la VM:

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg git

# Docker (Debian 12 / bookworm)
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian $(. /etc/os-release && echo $VERSION_CODENAME) stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Que el usuario actual pueda correr docker sin sudo
sudo usermod -aG docker $USER
newgrp docker

docker version
docker compose version
```

Swap (obligatorio en 1 GB, antes del primer build):

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## 5. Clonar el repo

```bash
sudo mkdir -p /opt/urbanattic
sudo chown $USER:$USER /opt/urbanattic
cd /opt/urbanattic
git clone https://github.com/FrancoCazal/UrbanAttic.git .
```

---

## 6. Crear `backend/.env.production`

```bash
cp backend/.env.production.example backend/.env.production
nano backend/.env.production
```

Llená los valores reales. Para generar un `SECRET_KEY` fuerte:

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(64))"
```

Para `DB_PASSWORD` también algo random largo:

```bash
openssl rand -base64 32
```

`FRONTEND_URL` es a donde vuelve el checkout de Stripe: tiene que ser un dominio que resuelva. Si `urbanattic.francocazal.com` no está configurado en Vercel, usá `https://urbanattic.vercel.app`.

> El archivo está en `.gitignore`, no lo commitees. Mantenelo solo en la VM.

---

## 7. Primer arranque

```bash
cd /opt/urbanattic

# Exportar variables que docker-compose.prod.yml necesita en su propia env
# (postgres lee DB_NAME/USER/PASSWORD del shell)
export $(grep -E '^(DB_NAME|DB_USER|DB_PASSWORD)=' backend/.env.production | xargs)

docker compose -f docker-compose.prod.yml up -d --build
```

Mientras Caddy obtiene el certificado de Let's Encrypt (primera vez, 30-60s), corré las migraciones:

```bash
docker compose -f docker-compose.prod.yml exec backend python manage.py migrate
docker compose -f docker-compose.prod.yml exec backend python manage.py seed
docker compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser  # opcional
```

---

## 8. Smoke test

```bash
# Desde tu laptop, no desde la VM:
curl -i https://api.urbanattic.francocazal.com/api/v1/health/
```

Debería responder `200 OK` con `{"status": "ok", "database": "ok", "redis": "ok"}`.

Logs si algo falla:

```bash
docker compose -f docker-compose.prod.yml logs caddy
docker compose -f docker-compose.prod.yml logs backend
docker compose -f docker-compose.prod.yml logs celery
```

---

## 9. Actualizar Stripe webhook

En el dashboard de Stripe → Developers → Webhooks:

1. Eliminá los endpoints viejos (Railway: `urbanattic.up.railway.app`).
2. Si no existe, creá `https://api.urbanattic.francocazal.com/api/v1/orders/webhook/stripe/`
3. Suscribite a `checkout.session.completed` (el único evento que procesa el backend)
4. Copiá el nuevo `whsec_...` a `backend/.env.production` (`STRIPE_WEBHOOK_SECRET=`)
5. Reiniciá el backend:
   ```bash
   docker compose -f docker-compose.prod.yml restart backend celery
   ```

---

## 10. Verificar Vercel

El `frontend/vercel.json` reescribe `/api/*` a `api.urbanattic.francocazal.com`. Vercel redeploya solo con cada push a `main`.

Opcional pero recomendado: en Vercel → Project Settings → Domains, agregar `urbanattic.francocazal.com` como custom domain si todavía no está.

Probá end-to-end:

1. Entrar a `https://urbanattic.francocazal.com`
2. Registrarse con un email de verdad
3. Recibir el email de verificación
4. Verificar, login, agregar producto al carrito, checkout con `4242 4242 4242 4242`
5. Confirmar que llega el email de orden y que la orden pasa a PROCESSING en la DB

---

## Mantenimiento

### Ver logs

```bash
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f --tail=100
```

### Redeployar después de un push

```bash
cd /opt/urbanattic
git pull
docker compose -f docker-compose.prod.yml build backend celery
docker compose -f docker-compose.prod.yml up -d --no-deps backend celery
docker compose -f docker-compose.prod.yml exec backend python manage.py migrate
```

### Backup de Postgres

```bash
# Dump local
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U $DB_USER $DB_NAME | gzip > backup-$(date +%F).sql.gz

# Copiar a tu laptop
gcloud compute scp urbanattic:/opt/urbanattic/backup-*.sql.gz ./ --zone=us-central1-a
```

Snapshots del disco (tienen costo; para el demo alcanza con volver a correr `seed`):

```bash
gcloud compute resource-policies create snapshot-schedule daily-backup \
  --region=us-central1 \
  --max-retention-days=14 \
  --on-source-disk-delete=keep-auto-snapshots \
  --daily-schedule \
  --start-time=06:00

gcloud compute disks add-resource-policies urbanattic \
  --resource-policies=daily-backup \
  --zone=us-central1-a
```

### Reiniciar la VM (después de actualizar el kernel, etc.)

```bash
gcloud compute instances reset urbanattic --zone=us-central1-a
```

`restart: unless-stopped` en cada servicio hace que docker compose levante todo solo al bootear.

### Costos

| Recurso | Costo aprox |
|---|---|
| e2-micro (24/7, us-central1) | $0 (free tier) |
| Disco 30GB pd-standard | $0 (free tier) |
| IPv4 externa en uso | ~$3,65/mes (no figura en el free tier) |
| Egress (tráfico salida) | gratis hasta 1GB/mes, después ~$0.12/GB |
| **Total** | **~$0–3,65/mes** |

Alerta de presupuesto para enterarte si algo empieza a cobrar:

```bash
gcloud billing budgets create \
  --billing-account=TU-BILLING-ACCOUNT-ID \
  --display-name=urbanattic \
  --budget-amount=5USD \
  --threshold-rule=percent=0.2 \
  --threshold-rule=percent=1.0
```

### Apagar para no gastar mientras no usás

```bash
gcloud compute instances stop urbanattic --zone=us-central1-a
# Re-encender:
gcloud compute instances start urbanattic --zone=us-central1-a
```

VM apagada no factura compute, pero sí el disco (~$1/mes) y la IP si la dejaste reservada sin attachear.

---

## Cosas que pueden romperse

**Caddy no obtiene certificado:** revisar que el DNS realmente apunte a la IP de la VM (`dig api.urbanattic.francocazal.com +short` desde tu laptop debe devolver la IP de GCP) y que el firewall tenga 80 + 443 abiertos. Caddy logs (`docker compose logs caddy`) son explícitos.

**Backend devuelve 400 "Bad Request" en /api/v1/health/:** falta `api.urbanattic.francocazal.com` en `ALLOWED_HOSTS`. Editar `.env.production` y `docker compose restart backend`.

**Login funciona pero "me" devuelve 401 desde el frontend:** las cookies no están viajando. Verificá que la rewrite de Vercel sea `https://` (no `http://`) y que `SECURE_SSL_REDIRECT` y `samesite=Lax` estén OK en producción.

**OOM (out of memory) en e2-micro:** confirmá que el swap esté activo (`swapon --show`) y bajá gunicorn a un worker: `GUNICORN_WORKERS=1 docker compose -f docker-compose.prod.yml up -d backend`. Celery ya corre con `CELERY_CONCURRENCY=1` por defecto.

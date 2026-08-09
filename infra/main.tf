# ------------------------------------------------------------
# 1. Red privada para comunicar DB, backend y frontend
# ------------------------------------------------------------
resource "docker_network" "app_network" {
  name = "practica_tf_network"
}

# ------------------------------------------------------------
# 2. Volumen persistente para PostgreSQL
# ------------------------------------------------------------
resource "docker_volume" "postgres_data" {
  name = "practica_tf_postgres_data"
}

# ------------------------------------------------------------
# 3. Imagen oficial de PostgreSQL
# ------------------------------------------------------------
resource "docker_image" "postgres" {
  name         = "postgres:17"
  keep_locally = true
}

# ------------------------------------------------------------
# 4. Imágenes locales construidas en la Sesión 2
# ------------------------------------------------------------
data "docker_image" "backend" {
  name = "practica-backend:1.0"
}

data "docker_image" "frontend" {
  name = "practica-frontend:1.0"
}

# ------------------------------------------------------------
# 5. Contenedor PostgreSQL
# ------------------------------------------------------------
resource "docker_container" "db" {
  name    = "practica_tf_postgres"
  image   = docker_image.postgres.image_id
  restart = "unless-stopped"

  env = [
    "POSTGRES_USER=${var.db_user}",
    "POSTGRES_PASSWORD=${var.db_password}",
    "POSTGRES_DB=${var.db_name}"
  ]

  ports {
    internal = 5432
    external = var.db_host_port
  }

  networks_advanced {
    name    = docker_network.app_network.name
    aliases = ["db"]
  }

  volumes {
    volume_name    = docker_volume.postgres_data.name
    container_path = "/var/lib/postgresql/data"
  }

  healthcheck {
    test         = ["CMD-SHELL", "pg_isready -U ${var.db_user} -d ${var.db_name}"]
    interval     = "5s"
    timeout      = "3s"
    retries      = 10
    start_period = "5s"
  }

  wait         = true
  wait_timeout = 90
}

# ------------------------------------------------------------
# 6. Contenedor Backend (Fastify + Prisma)
# ------------------------------------------------------------
resource "docker_container" "backend" {
  name     = "practica_tf_backend"
  image    = data.docker_image.backend.id #data.docker_image.backend.image_id
  restart  = "unless-stopped"
  must_run = true

  env = [
    "DATABASE_URL=postgresql://${var.db_user}:${var.db_password}@db:5432/${var.db_name}?schema=public",
    "PORT=3000",
    "HOST=0.0.0.0"
  ]

  ports {
    internal = 3000
    external = var.backend_host_port
  }

  networks_advanced {
    name    = docker_network.app_network.name
    aliases = ["backend"]
  }

  depends_on = [docker_container.db]
}

# ------------------------------------------------------------
# 7. Contenedor Frontend (Vite)
# ------------------------------------------------------------
resource "docker_container" "frontend" {
  name     = "practica_tf_frontend"
  image    = data.docker_image.frontend.id #data.docker_image.frontend.image_id
  restart  = "unless-stopped"
  must_run = true

  env = [
    "VITE_API_URL=http://localhost:${var.backend_host_port}"
  ]

  ports {
    internal = 5173
    external = var.frontend_host_port
  }

  networks_advanced {
    name = docker_network.app_network.name
  }

  depends_on = [docker_container.backend]
}

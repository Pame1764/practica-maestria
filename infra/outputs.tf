output "frontend_url" {
  description = "URL del frontend"
  value       = "http://localhost:${var.frontend_host_port}"
}

output "backend_users_url" {
  description = "Endpoint del CRUD de usuarios"
  value       = "http://localhost:${var.backend_host_port}/api/users"
}

output "postgres_host_port" {
  description = "Puerto PostgreSQL en el host"
  value       = var.db_host_port
}

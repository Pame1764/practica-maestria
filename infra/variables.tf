variable "db_user" {
  description = "Usuario de PostgreSQL"
  type        = string
  default     = "postgres"
}

variable "db_password" {
  description = "Contraseña de PostgreSQL para el laboratorio"
  type        = string
  sensitive   = true
}

variable "db_name" {
  description = "Nombre de la base de datos"
  type        = string
  default     = "practica_db"
}

variable "db_host_port" {
  description = "Puerto PostgreSQL publicado en Windows"
  type        = number
  default     = 5434
}

variable "backend_host_port" {
  description = "Puerto del backend publicado en Windows"
  type        = number
  default     = 3001
}

variable "frontend_host_port" {
  description = "Puerto del frontend publicado en Windows"
  type        = number
  default     = 5174
}

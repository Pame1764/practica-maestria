import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  TextInput,
  Select,
  Group,
  ActionIcon,
  Text,
  Badge,
  Paper,
  Title,
  Flex,
  Stack,
  Loader,
  Alert,
  Tooltip,
  Avatar,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  
  IconPencil,
  IconTrash,
  IconUserPlus,
  IconAlertCircle,
  IconCheck,
  IconRefresh,
  IconUsers,
} from '@tabler/icons-react';

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

const BASE_URL = import.meta.env.VITE_API_URL || '';
const API_URL = `${BASE_URL.replace(/\/$/, '')}/api/users`;

export const UserCrud: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user',
  });
  const [formSubmitting, setFormSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) {
        throw new Error('No se pudo obtener la lista de usuarios');
      }
      const data = await res.json();
      setUsers(data);
    } catch {
      setError(
        'No se pudo conectar con el servidor backend (http://localhost:3001). Asegúrate de tener corriendo el servidor Fastify y la base de datos PostgreSQL.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', role: 'user' });
    setModalOpen(true);
  };

  const handleOpenEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({ name: user.name, email: user.email, role: user.role });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      notifications.show({
        title: 'Error de validación',
        message: 'El nombre y correo electrónico son requeridos',
        color: 'red',
      });
      return;
    }

    setFormSubmitting(true);
    try {
      const url = editingUser ? `${API_URL}/${editingUser.id}` : API_URL;
      const method = editingUser ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.message || 'Error al guardar usuario');
      }

      notifications.show({
        title: editingUser ? 'Usuario actualizado' : 'Usuario creado',
        message: editingUser
          ? `El usuario ${resData.name} ha sido actualizado correctamente.`
          : `El usuario ${resData.name} ha sido registrado.`,
        color: 'green',
        icon: <IconCheck size={16} />,
      });

      setModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      notifications.show({
        title: 'Error',
        message: err.message || 'Ocurrió un error inesperado',
        color: 'red',
      });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    try {
      const res = await fetch(`${API_URL}/${userToDelete.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Error al eliminar usuario');
      }

      notifications.show({
        title: 'Usuario eliminado',
        message: `El usuario ${userToDelete.name} fue eliminado con éxito.`,
        color: 'blue',
        icon: <IconCheck size={16} />,
      });

      setDeleteModalOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (err: any) {
      notifications.show({
        title: 'Error',
        message: err.message || 'No se pudo eliminar el usuario',
        color: 'red',
      });
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return <Badge color="violet" variant="light">Administrador</Badge>;
      case 'editor':
        return <Badge color="cyan" variant="light">Editor</Badge>;
      default:
        return <Badge color="blue" variant="light">Usuario</Badge>;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <Stack gap="lg">
      {/* Target header / toolbar */}
      <Paper p="xl" className="glass-card">
        <Flex justify="space-between" align="center" wrap="wrap" gap="md">
          <Group>
            <Avatar color="indigo" radius="md" size="lg">
              <IconUsers size={28} />
            </Avatar>
            <div>
              <Title order={2} style={{ color: '#f8fafc' }}>
                Gestión de Usuarios
              </Title>
              <Text size="sm" c="dimmed">
                Administra los registros almacenados en la base de datos PostgreSQL
              </Text>
            </div>
          </Group>

          <Group>
            <Tooltip label="Recargar datos">
              <ActionIcon variant="default" size="lg" radius="md" onClick={fetchUsers} loading={loading}>
                <IconRefresh size={18} />
              </ActionIcon>
            </Tooltip>
            <Button
              leftSection={<IconUserPlus size={18} />}
              color="indigo"
              radius="md"
              size="md"
              onClick={handleOpenCreateModal}
            >
              Nuevo Usuario
            </Button>
          </Group>
        </Flex>
      </Paper>

      {/* Alerta de Error */}
      {error && (
        <Alert icon={<IconAlertCircle size={16} />} title="Error de conexión" color="red" radius="md">
          {error}
        </Alert>
      )}

      {/* Tabla de Usuarios */}
      <Paper p="md" className="glass-card">
        {loading ? (
          <Flex justify="center" align="center" p="xl" direction="column" gap="sm">
            <Loader color="indigo" type="dots" />
            <Text size="sm" c="dimmed">Cargando usuarios desde PostgreSQL...</Text>
          </Flex>
        ) : users.length === 0 ? (
          <Flex justify="center" align="center" p="xl" direction="column" gap="xs">
            <IconUsers size={48} color="#64748b" />
            <Text fw={500} size="lg" c="dimmed">No hay usuarios registrados</Text>
            <Text size="sm" c="dimmed">Haz clic en "Nuevo Usuario" para agregar el primero.</Text>
            <Button mt="xs" variant="light" color="indigo" onClick={handleOpenCreateModal}>
              Crear Usuario
            </Button>
          </Flex>
        ) : (
          <Table.ScrollContainer minWidth={600}>
            <Table verticalSpacing="sm" horizontalSpacing="md">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ color: '#94a3b8' }}>ID</Table.Th>
                  <Table.Th style={{ color: '#94a3b8' }}>Usuario</Table.Th>
                  <Table.Th style={{ color: '#94a3b8' }}>Email</Table.Th>
                  <Table.Th style={{ color: '#94a3b8' }}>Rol</Table.Th>
                  <Table.Th style={{ color: '#94a3b8' }}>Fecha de Registro</Table.Th>
                  <Table.Th style={{ color: '#94a3b8', textAlign: 'right' }}>Acciones</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {users.map((user) => (
                  <Table.Tr key={user.id} className="user-row">
                    <Table.Td fw={600} style={{ color: '#6366f1' }}>
                      #{user.id}
                    </Table.Td>
                    <Table.Td>
                      <Group gap="sm">
                        <Avatar color="indigo" radius="xl" size="sm">
                          {getInitials(user.name)}
                        </Avatar>
                        <Text size="sm" fw={600} style={{ color: '#f1f5f9' }}>
                          {user.name}
                        </Text>
                      </Group>
                    </Table.Td>
                    <Table.Td style={{ color: '#cbd5e1' }}>{user.email}</Table.Td>
                    <Table.Td>{getRoleBadge(user.role)}</Table.Td>
                    <Table.Td style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                      {new Date(user.createdAt).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs" justify="flex-end">
                        <Tooltip label="Editar usuario">
                          <ActionIcon
                            variant="subtle"
                            color="indigo"
                            onClick={() => handleOpenEditModal(user)}
                          >
                            <IconPencil size={18} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Eliminar usuario">
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            onClick={() => {
                              setUserToDelete(user);
                              setDeleteModalOpen(true);
                            }}
                          >
                            <IconTrash size={18} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Paper>

      {/* Modal para Crear / Editar Usuario */}
      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          <Text fw={700} size="lg" style={{ color: '#f8fafc' }}>
            {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
          </Text>
        }
        centered
        styles={{
          content: { background: '#1e293b', color: '#f8fafc' },
          header: { background: '#1e293b' },
        }}
      >
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <TextInput
              label="Nombre Completo"
              placeholder="Ej: María García"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <TextInput
              label="Correo Electrónico"
              placeholder="maria@ejemplo.com"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Select
              label="Rol"
              data={[
                { value: 'user', label: 'Usuario Standard' },
                { value: 'editor', label: 'Editor' },
                { value: 'admin', label: 'Administrador' },
              ]}
              value={formData.role}
              onChange={(val) => setFormData({ ...formData, role: val || 'user' })}
            />
            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" color="indigo" loading={formSubmitting}>
                {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Modal Confirmar Eliminación */}
      <Modal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title={
          <Text fw={700} size="lg" color="red">
            Confirmar eliminación
          </Text>
        }
        centered
        styles={{
          content: { background: '#1e293b', color: '#f8fafc' },
          header: { background: '#1e293b' },
        }}
      >
        <Stack gap="md">
          <Text size="sm">
            ¿Estás seguro de que deseas eliminar al usuario{' '}
            <Text span fw={700} c="indigo">
              {userToDelete?.name}
            </Text>
            ? Esta acción no se puede deshacer.
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setDeleteModalOpen(false)}>
              Cancelar
            </Button>
            <Button color="red" onClick={handleDeleteConfirm}>
              Eliminar
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
};

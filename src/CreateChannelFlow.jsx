import { useState } from "react";
import { Avatar } from "stream-chat-react";

/**
 * Componente para crear nuevos canales/chats con contactos
 * Basado en la documentación de Stream: https://getstream.io/chat/docs/react/creating_channels/
 */
export default function CreateChannelFlow({ 
  client, 
  currentUser, 
  availableUsers, 
  onChannelCreated,
  onCancel,
  isGroupMode = false // Nuevo prop para alternar entre chat 1-1 y grupo
}) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]); // Para modo grupo
  const [channelName, setChannelName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Opción 1: Crear canal "distinct" - Stream maneja automáticamente la unicidad
   * No requiere especificar un ID, Stream lo genera basado en los miembros
   */
  const createDistinctChannel = async (otherUserId) => {
    try {
      setIsCreating(true);
      setError(null);

      const channel = client.channel("messaging", {
        members: [currentUser.id, otherUserId],
        // Datos adicionales opcionales
        name: channelName || undefined,
      });

      // create() verifica si el canal ya existe, si no lo crea
      await channel.create();
      
      console.log("✅ Canal distinct creado:", channel.id);
      return channel;
    } catch (err) {
      console.error("❌ Error al crear canal distinct:", err);
      throw err;
    }
  };

  /**
   * Opción 2: Crear canal con ID personalizado
   * Útil si quieres tener control sobre el ID del canal
   */
  const createChannelWithCustomId = async (otherUserId, otherUserName) => {
    try {
      setIsCreating(true);
      setError(null);

      // Crear un ID único basado en los IDs de los usuarios (ordenados)
      const userIds = [currentUser.id, otherUserId].sort();
      const channelId = `chat-${userIds[0]}-${userIds[1]}`;

      const channel = client.channel("messaging", channelId, {
        members: [currentUser.id, otherUserId],
        name: channelName || otherUserName,
      });

      // watch() crea el canal si no existe y lo observa en una sola llamada
      await channel.watch();
      
      console.log("✅ Canal con ID personalizado creado:", channelId);
      return channel;
    } catch (err) {
      console.error("❌ Error al crear canal con ID:", err);
      throw err;
    }
  };

  /**
   * Opción 3: Crear canal de grupo con múltiples participantes
   * Requiere un nombre y permite agregar/remover miembros después
   */
  const createGroupChannel = async (memberIds, groupName) => {
    try {
      setIsCreating(true);
      setError(null);

      // Generar un ID único para el grupo
      const channelId = `group-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      // Incluir al usuario actual en los miembros
      const allMembers = [currentUser.id, ...memberIds];

      const channel = client.channel("messaging", channelId, {
        members: allMembers,
        name: groupName,
        // Campos personalizados para grupos (evitar nombres reservados)
        is_group: true,
        creator_id: currentUser.id,
      });

      await channel.watch();
      
      console.log("✅ Grupo creado con", allMembers.length, "miembros:", channelId);
      return channel;
    } catch (err) {
      console.error("❌ Error al crear grupo:", err);
      throw err;
    }
  };

  // Toggle selección de usuarios en modo grupo
  const toggleUserSelection = (user) => {
    setSelectedUsers((prev) => {
      const isSelected = prev.some((u) => u.id === user.id);
      if (isSelected) {
        return prev.filter((u) => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleCreateChannel = async () => {
    // Validaciones según el modo
    if (isGroupMode) {
      if (selectedUsers.length < 2) {
        setError("Por favor selecciona al menos 2 participantes para el grupo");
        return;
      }
      if (!channelName.trim()) {
        setError("Por favor ingresa un nombre para el grupo");
        return;
      }
    } else {
      if (!selectedUser) {
        setError("Por favor selecciona un contacto");
        return;
      }
    }

    try {
      let channel;
      
      if (isGroupMode) {
        // Crear grupo con múltiples usuarios
        const memberIds = selectedUsers.map((u) => u.id);
        channel = await createGroupChannel(memberIds, channelName);
      } else {
        // Crear chat 1-1
        // Puedes elegir entre las dos opciones:
        // channel = await createDistinctChannel(selectedUser.id);
        channel = await createChannelWithCustomId(selectedUser.id, selectedUser.name);
      }
      
      // Notificar al componente padre que el canal fue creado
      if (onChannelCreated) {
        onChannelCreated(channel);
      }
    } catch (err) {
      setError("Error al crear el canal. Por favor intenta de nuevo.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
    }}>
      <div style={{
        backgroundColor: "white",
        borderRadius: "12px",
        padding: "30px",
        maxWidth: "500px",
        width: "90%",
        maxHeight: "80vh",
        overflow: "auto",
        boxShadow: "0 10px 40px rgba(0, 0, 0, 0.3)",
      }}>
        {/* Header */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}>
          <h2 style={{ margin: 0 }}>
            {isGroupMode ? "Nuevo Grupo" : "Nuevo Chat"}
          </h2>
          <button
            onClick={onCancel}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              color: "#999",
            }}
          >
            ×
          </button>
        </div>

        {/* Nombre del canal */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{
            display: "block",
            marginBottom: "8px",
            fontWeight: "500",
            color: "#333",
          }}>
            Nombre del {isGroupMode ? "grupo" : "chat"} {isGroupMode ? "" : "(opcional)"}
          </label>
          <input
            type="text"
            value={channelName}
            onChange={(e) => setChannelName(e.target.value)}
            placeholder={isGroupMode ? "Ej: Equipo de Desarrollo" : "Ej: Proyecto ABC"}
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "6px",
              fontSize: "14px",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Lista de contactos */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{
            display: "block",
            marginBottom: "12px",
            fontWeight: "500",
            color: "#333",
          }}>
            {isGroupMode 
              ? `Selecciona participantes (${selectedUsers.length} seleccionados)` 
              : "Selecciona un contacto"}
          </label>
          <div style={{
            maxHeight: "300px",
            overflow: "auto",
            border: "1px solid #ddd",
            borderRadius: "8px",
          }}>
            {availableUsers.map((user) => {
              const isSelected = isGroupMode 
                ? selectedUsers.some((u) => u.id === user.id)
                : selectedUser?.id === user.id;
              
              return (
                <div
                  key={user.id}
                  onClick={() => isGroupMode ? toggleUserSelection(user) : setSelectedUser(user)}
                  style={{
                    padding: "12px 16px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    backgroundColor: isSelected ? "#e3f2fd" : "transparent",
                    borderBottom: "1px solid #f0f0f0",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = "#f5f5f5";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }
                  }}
                >
                  <Avatar
                    name={user.name}
                    size={40}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "500", fontSize: "15px" }}>
                      {user.name}
                    </div>
                    <div style={{ fontSize: "13px", color: "#666" }}>
                      {user.id}
                    </div>
                  </div>
                  {isSelected && (
                    <div style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      backgroundColor: "#005fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontSize: "12px",
                    }}>
                      ✓
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div style={{
            padding: "12px",
            backgroundColor: "#ffebee",
            color: "#c62828",
            borderRadius: "6px",
            marginBottom: "20px",
            fontSize: "14px",
          }}>
            {error}
          </div>
        )}

        {/* Buttons */}
        <div style={{
          display: "flex",
          gap: "12px",
          justifyContent: "flex-end",
        }}>
          <button
            onClick={onCancel}
            disabled={isCreating}
            style={{
              padding: "10px 24px",
              backgroundColor: "#f5f5f5",
              color: "#333",
              border: "none",
              borderRadius: "6px",
              cursor: isCreating ? "not-allowed" : "pointer",
              fontWeight: "500",
              fontSize: "14px",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleCreateChannel}
            disabled={isCreating || (isGroupMode ? selectedUsers.length < 2 : !selectedUser)}
            style={{
              padding: "10px 24px",
              backgroundColor: (isGroupMode ? selectedUsers.length >= 2 : selectedUser) && !isCreating ? "#005fff" : "#ccc",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: (isGroupMode ? selectedUsers.length >= 2 : selectedUser) && !isCreating ? "pointer" : "not-allowed",
              fontWeight: "500",
              fontSize: "14px",
            }}
          >
            {isCreating ? "Creando..." : isGroupMode ? "Crear Grupo" : "Crear Chat"}
          </button>
        </div>
      </div>
    </div>
  );
}

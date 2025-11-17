// AppWithChatCall.jsx
import { useState, useEffect } from "react";
import { StreamChat } from "stream-chat";
import {
  Chat,
  Channel,
  ChannelHeader,
  MessageInput,
  MessageList,
  Thread,
  Window,
  ChannelList,
  Avatar,
} from "stream-chat-react";

import "stream-chat-react/dist/css/v2/index.css";

// 👉 TU API KEY
const apiKey = "n2s9ec2gep9x";

// 👉 Tres usuarios con tokens MANUALES generados en Stream
const fakeUsers = [
  {
    id: "user-a",
    name: "Usuario A",
    token:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidXNlci1hIn0.4zKrc1FQQeiH_pcKU7qyT0Amh9dLEnn2EObvmnaCC_w",
  },
  {
    id: "user-b",
    name: "Usuario B",
    token:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidXNlci1iIn0.pK9nuDR4VobSRi28_8hg6HEtgVlft4hNaNxdvph8mwo",
  },
  {
    id: "user-c",
    name: "Usuario C",
    token:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidXNlci1jIn0.KCaG05FWqYid_GnJiPmUg5sR5mtaNjM2XhophJmJsHA", // 👈 Reemplaza con el token generado para user-c
  },
];

export default function AppWithChatCall() {
  const [client, setClient] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // =========================================================
  // 🔹 Iniciar el cliente de chat con un usuario + token manual
  // =========================================================
  const initClient = async (user) => {
    try {
      // ✅ Obtener instancia y desconectar si ya existe una conexión previa
      const chatClient = StreamChat.getInstance(apiKey);

      if (chatClient.userID) {
        console.log("🔌 Desconectando usuario anterior...");
        await chatClient.disconnectUser();
      }

      console.log("🔌 Conectando usuario al chat:", user.name);

      await chatClient.connectUser(
        {
          id: user.id,
          name: user.name,
        },
        user.token
      );

      console.log("✅ Usuario conectado al chat:", user.name);

      // ✅ Crear canales con todos los demás usuarios
      const otherUsers = fakeUsers.filter((u) => u.id !== user.id);

      for (const otherUser of otherUsers) {
        const userIds = [user.id, otherUser.id].sort();
        const channelId = `chat-${userIds[0]}-${userIds[1]}`;

        const channel = chatClient.channel("messaging", channelId, {
          members: [user.id, otherUser.id],
          name: otherUser.name,
        });

        await channel.watch();
        console.log(`✅ Canal creado con ${otherUser.name}`);
      }

      setClient(chatClient);
      setCurrentUser(user);
    } catch (error) {
      console.error("❌ Error al conectar usuario:", error);
    }
  };

  // =========================================================
  // 🔹 Limpiar cliente al desmontar
  // =========================================================
  useEffect(() => {
    return () => {
      if (client) {
        client.disconnectUser();
        console.log("🔌 Usuario desconectado");
      }
    };
  }, [client]);

  // =========================================================
  // 🔹 Pantalla inicial: Elegir usuario
  // =========================================================
  if (!client) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Elige tu usuario para iniciar sesión en el chat</h2>

        {fakeUsers.map((u) => (
          <button
            key={u.id}
            onClick={() => initClient(u)}
            style={{ display: "block", margin: "10px 0", padding: "10px 20px" }}
          >
            Entrar como {u.name}
          </button>
        ))}
      </div>
    );
  }

  // =========================================================
  // 🔹 UI del Chat con lista lateral
  // =========================================================
  const filters = {
    type: "messaging",
    members: { $in: [currentUser.id] },
  };

  const sort = { last_message_at: -1 };

  const CustomChannelPreview = (props) => {
    const { channel, setActiveChannel, activeChannel } = props;

    console.log("Canal en preview:", channel);

    const { messages } = channel.state;
    const messagePreview = messages[messages.length - 1]?.text?.slice(0, 30);
    const isActive = activeChannel?.id === channel.id;

    return (
      <div
        onClick={() => setActiveChannel?.(channel)}
        style={{
          margin: "12px",
          display: "flex",
          gap: "5px",
          padding: "10px",
          borderRadius: "8px",
          backgroundColor: isActive ? "#e0e0e0" : "transparent",
          cursor: "pointer",
          transition: "background-color 0.2s",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <div>
          <Avatar className="custom-avatar" name={channel.data?.name} image={channel.data?.image} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: isActive ? "600" : "normal" }}>
            {channel.data?.name || "Unnamed Channel"}
          </div>
          {messagePreview ? (
            <div style={{ fontSize: "14px" }}>{messagePreview}</div>
          ) : (
            <div style={{ fontSize: "14px", color: "#aaa" }}>
              No messages yet
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: 15,
          background: "#005fff",
          color: "white",
          borderBottom: "1px solid #ddd",
          flexShrink: 0,
        }}
      >
        <strong>Stream Chat - {currentUser.name}</strong>
      </div>

      {/* Chat Layout */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <Chat client={client} theme="str-chat__theme-light">
          <ChannelList
            Preview={CustomChannelPreview}
            filters={filters}
            sort={sort}
            options={{ limit: 10 }}
          />
          <Channel>
            <Window>
              <ChannelHeader />
              <MessageList />
              <MessageInput />
            </Window>
            <Thread />
          </Channel>
        </Chat>
      </div>
    </div>
  );
}

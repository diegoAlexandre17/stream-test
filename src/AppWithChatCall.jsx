// AppWithChatCall.jsx
import { useState, useEffect } from "react";
import { StreamChat } from "stream-chat";
import { 
  StreamVideoClient,
  StreamVideo,
  StreamCall,
  StreamTheme,
  CallControls,
  SpeakerLayout,
  CallParticipantsList,
  CallingState,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";
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
  useChannelStateContext,
} from "stream-chat-react";

import "stream-chat-react/dist/css/v2/index.css";
import "@stream-io/video-react-sdk/dist/css/styles.css";

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
  const [videoClient, setVideoClient] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [activeCall, setActiveCall] = useState(null);

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

      // ✅ Inicializar y conectar cliente de video
      const videoClientInstance = new StreamVideoClient({
        apiKey,
        user: { id: user.id, name: user.name },
        tokenProvider: () => Promise.resolve(user.token),
      });
      
      await videoClientInstance.connectUser(
        { id: user.id, name: user.name },
        user.token
      );
      console.log("✅ Cliente de video conectado");

      setVideoClient(videoClientInstance);

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
  // 🔹 Limpiar cliente al desmontar el componente
  // =========================================================
  useEffect(() => {
    return () => {
      // Solo se ejecuta cuando el componente se desmonta completamente
      if (client) {
        client.disconnectUser();
        console.log("🔌 Usuario desconectado del chat");
      }
      if (videoClient) {
        videoClient.disconnectUser();
        console.log("🔌 Usuario desconectado del video");
      }
    };
  }, []); // ← Sin dependencias, solo cleanup al desmontar

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

  // =========================================================
  // 🔹 Componente personalizado para el header con botón de llamada
  // =========================================================
  const CustomChannelHeader = () => {
    const { channel } = useChannelStateContext();

    const handleStartCall = async () => {
      const otherMember = Object.values(channel.state.members).find(
        (member) => member.user.id !== currentUser.id
      );

      if (otherMember) {
        console.log("📞 Iniciando llamada con:", otherMember.user.name);
        
        const callType = "default";
        const userIds = [currentUser.id, otherMember.user.id].sort();
        const callId = `call-${userIds[0]}-${userIds[1]}`;
        const call = videoClient.call(callType, callId);
        
        await call.getOrCreate({
          data: {
            members: [
              { user_id: currentUser.id },
              { user_id: otherMember.user.id }
            ],
          },
        });

        console.log("✅ Llamada creada:", callId);
        await call.join();
        setActiveCall(call);
        setIsCallActive(true);
      }
    };

    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "15px 20px",
          borderBottom: "1px solid #ddd",
          backgroundColor: "#fff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Avatar
            name={channel.data?.name}
            image={channel.data?.image}
            size={40}
          />
          <div>
            <div style={{ fontWeight: "600", fontSize: "16px" }}>
              {channel.data?.name || "Canal"}
            </div>
            <div style={{ fontSize: "12px", color: "#666" }}>
              {Object.keys(channel.state.members).length} miembros
            </div>
          </div>
        </div>
        <button
          onClick={handleStartCall}
          style={{
            padding: "10px 20px",
            backgroundColor: "#00d95f",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
          onMouseOver={(e) => (e.target.style.backgroundColor = "#00b84f")}
          onMouseOut={(e) => (e.target.style.backgroundColor = "#00d95f")}
        >
          <span style={{ fontSize: "18px" }}>📞</span>
          Llamar
        </button>
      </div>
    );
  };

  const CustomChannelPreview = (props) => {
    const { channel, setActiveChannel, activeChannel } = props;

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
          <Avatar
            className="custom-avatar"
            name={channel.data?.name}
            image={channel.data?.image}
          />
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

  // =========================================================
  // 🔹 Componente de interfaz de llamada usando componentes por defecto de Stream
  // =========================================================
  const CallInterface = () => {
    const { useCallCallingState } = useCallStateHooks();
    const callingState = useCallCallingState();

    const handleEndCall = async () => {
      if (activeCall) {
        await activeCall.leave();
        setActiveCall(null);
        setIsCallActive(false);
      }
    };

    if (callingState !== CallingState.JOINED) {
      return (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.9)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          zIndex: 1000,
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "24px", marginBottom: "20px" }}>📞</div>
            <div>Conectando a la llamada...</div>
          </div>
        </div>
      );
    }

    return (
      <StreamTheme>
        <SpeakerLayout participantsBarPosition='bottom' />
        <CallControls onLeave={handleEndCall} />
      </StreamTheme>
    );
  };

  // =========================================================
  // 🔹 Si hay una llamada activa, mostrar interfaz de llamada
  // =========================================================
  if (isCallActive && activeCall && videoClient) {
    return (
      <StreamVideo client={videoClient}>
        <StreamCall call={activeCall}>
          <CallInterface />
        </StreamCall>
      </StreamVideo>
    );
  }

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
              <CustomChannelHeader />
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

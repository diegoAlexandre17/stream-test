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
import CreateChannelFlow from "./CreateChannelFlow";
import CustomChannelHeader from "./components/CustomChannelHeader";
import CustomChannelPreview from "./components/CustomChannelPreview";
import CallInterface from "./components/CallInterface";
import CustomMessageInput from "./components/CustomMessageInput";
import CustomMessage from "./components/CustomMessage";

// 👉 TU API KEY
const apiKey = "mqnxbqw5kvmm";

// 👉 Tres usuarios con tokens MANUALES generados en Stream
const fakeUsers = [
  {
    id: "user1",
    name: "Usuario 1",
    token:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidXNlcjEifQ.EUYOqtv9x_dW6mU8kYR55Bd7KfD6mGrlnEvayFzxcAQ",
  },
  {
    id: "user2",
    name: "Usuario 2",
    token:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidXNlcjIifQ.g1ThcoW_6CnPbqLtL9NwSGrpjj6WD-4yXpNqdNwOGrs",
  },
  {
    id: "user3",
    name: "Usuario 3",
    token:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidXNlcjMifQ.0JJPmImR0yNfEb14VrsIdu5GTEmciYGQjTk6Blv6DJI", // 👈 Reemplaza con el token generado para user-c
  },
];

export default function AppWithChatCall() {
  const [client, setClient] = useState(null);
  const [videoClient, setVideoClient] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [activeCall, setActiveCall] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [isGroupMode, setIsGroupMode] = useState(false);

  // =========================================================
  // 🔹 Escuchar llamadas entrantes
  // =========================================================
  useEffect(() => {
    if (!videoClient) return;

    console.log("👂 Escuchando llamadas para:", currentUser?.name);

    const handleIncomingCall = (event) => {
      console.log("📞 Llamada entrante detectada:", event);

      // Obtenemos la instancia correcta de la llamada desde el cliente
      const callInstance = videoClient.call(event.call.type, event.call.id);
      setIncomingCall(callInstance);
    };

    // ✅ Registrar el listener para llamadas entrantes
    videoClient.on("call.ring", handleIncomingCall);
    console.log("✅ Listener registrado para call.ring");

    return () => {
      console.log("🔇 Desregistrando listener call.ring");
      videoClient.off("call.ring", handleIncomingCall);
    };
  }, [videoClient, currentUser]);

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

      // ✅ Los canales se crearán bajo demanda cuando uses CreateChannelFlow
      // No creamos canales automáticamente para evitar problemas de permisos
      console.log(
        "✅ Usuario listo. Los canales se crearán cuando inicies una conversación."
      );

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
  // 🔹 Si hay una llamada activa, mostrar interfaz de llamada
  // =========================================================
  if (isCallActive && activeCall && videoClient) {
    return (
      <StreamVideo client={videoClient}>
        <StreamCall call={activeCall}>
          <CallInterface
            activeCall={activeCall}
            setActiveCall={setActiveCall}
            setIsCallActive={setIsCallActive}
          />
        </StreamCall>
      </StreamVideo>
    );
  }

  // =========================================================
  // 🔹 Si hay una llamada entrante, mostrar modal
  // =========================================================
  const handleAcceptCall = async () => {
    if (incomingCall) {
      console.log("✅ User B aceptando llamada entrante...");

      try {
        // 🔥 USER B entra a la sala SOLO cuando acepta
        await incomingCall.join();
        console.log("✅ User B entró a la sala donde ya está User A");

        setActiveCall(incomingCall);
        setIsCallActive(true);
        setIncomingCall(null);
      } catch (error) {
        console.error("❌ Error al unirse a la llamada:", error);
        setIncomingCall(null);
      }
    }
  };

  const handleRejectCall = async () => {
    if (incomingCall) {
      console.log("❌ Rechazando llamada entrante");
      await incomingCall.leave();
      setIncomingCall(null);
    }
  };

  // =========================================================
  // 🔹 Handlers para crear canal
  // =========================================================
  const handleChannelCreated = async (channel) => {
    console.log("✅ Nuevo canal creado:", channel.id);

    // Enviar un mensaje inicial para que aparezca en la lista
    await channel.sendMessage({
      text: `Grupo "${channel.data.name}" creado por ${currentUser.name}`,
      user_id: currentUser.id,
    });

    setShowCreateChannel(false);
    setIsGroupMode(false);
    // El canal aparecerá automáticamente en la lista
  };

  const handleOpenCreateChannel = (groupMode = false) => {
    setIsGroupMode(groupMode);
    setShowCreateChannel(true);
  };

  // Obtener usuarios disponibles (excluyendo el usuario actual)
  const availableUsers = fakeUsers.filter((u) => u.id !== currentUser?.id);

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Modal de llamada entrante */}
      {incomingCall && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "30px",
              maxWidth: "400px",
              textAlign: "center",
              boxShadow: "0 10px 40px rgba(0, 0, 0, 0.3)",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "20px" }}>📞</div>
            <h2 style={{ margin: "0 0 10px 0", fontSize: "24px" }}>
              Llamada entrante
            </h2>
            <p style={{ color: "#666", marginBottom: "30px" }}>
              Alguien te está llamando...
            </p>
            <div
              style={{ display: "flex", gap: "15px", justifyContent: "center" }}
            >
              <button
                onClick={handleRejectCall}
                style={{
                  padding: "12px 30px",
                  backgroundColor: "#ff4444",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "16px",
                }}
              >
                Rechazar
              </button>
              <button
                onClick={handleAcceptCall}
                style={{
                  padding: "12px 30px",
                  backgroundColor: "#00d95f",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "16px",
                }}
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="header">
        <strong>Stream Chat - {currentUser.name}</strong>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => handleOpenCreateChannel(false)}
            style={{
              padding: "8px 16px",
              backgroundColor: "#00d95f",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span style={{ fontSize: "16px" }}>💬</span>
            Nuevo Chat
          </button>
          <button
            onClick={() => handleOpenCreateChannel(true)}
            style={{
              padding: "8px 16px",
              backgroundColor: "#7c4dff",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span style={{ fontSize: "16px" }}>👥</span>
            Nuevo Grupo
          </button>
        </div>
      </div>

      {/* Chat Layout */}
      <div
        style={{ display: "flex", flex: 1, overflow: "hidden", width: "100%" }}
      >
        <Chat client={client} theme="str-chat__theme-light">
          <ChannelList
            Preview={CustomChannelPreview}
            filters={filters}
            sort={sort}
            options={{
              limit: 10,
              state: true,
              watch: true,
              presence: true,
            }}
          />
          <Channel>
            <Window>
              <CustomChannelHeader
                currentUser={currentUser}
                videoClient={videoClient}
                setActiveCall={setActiveCall}
                setIsCallActive={setIsCallActive}
              />
              <MessageList /* Message={CustomMessage} */ />
               {/* <MessageInput /> */}
              <CustomMessageInput />
            </Window>
            <Thread />
          </Channel>
        </Chat>
      </div>

      {/* Modal de crear nuevo canal */}
      {showCreateChannel && (
        <CreateChannelFlow
          client={client}
          currentUser={currentUser}
          availableUsers={availableUsers}
          onChannelCreated={handleChannelCreated}
          onCancel={() => {
            setShowCreateChannel(false);
            setIsGroupMode(false);
          }}
          isGroupMode={isGroupMode}
        />
      )}
    </div>
  );
}

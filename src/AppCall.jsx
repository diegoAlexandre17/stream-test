// App.jsx
import { useState, useEffect } from "react";
import {
  StreamVideo,
  StreamVideoClient,
  StreamCall,
  CallControls,
  ParticipantView,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";

// 👉 TU API KEY
const apiKey = "n2s9ec2gep9x";

// 👉 Dos usuarios con tokens MANUALES generados en Stream
const fakeUsers = [
  {
    id: "user-a",
    name: "Usuario A",
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidXNlci1hIn0.4zKrc1FQQeiH_pcKU7qyT0Amh9dLEnn2EObvmnaCC_w", // reemplazar
  },
  {
    id: "user-b",
    name: "Usuario B",
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidXNlci1iIn0.pK9nuDR4VobSRi28_8hg6HEtgVlft4hNaNxdvph8mwo", // reemplazar
  },
];

export default function App() {
  const [client, setClient] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [call, setCall] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);

  // =========================================================
  // 🔹 Escuchar llamadas entrantes
  // =========================================================
  useEffect(() => {
    if (!client) return;

    console.log("👂 Escuchando llamadas para:", currentUser?.name);

    const handleIncomingCall = (event) => {
      console.log("📞 Llamada entrante detectada:", event);
      console.log("📞 Datos del evento:", {
        callType: event.call.type,
        callId: event.call.id,
        members: event.members,
        created_by: event.created_by
      });
      
      // Obtenemos la instancia correcta de la llamada desde el cliente
      const callInstance = client.call(event.call.type, event.call.id);
      setIncomingCall(callInstance);
    };

    // ✅ IMPORTANTE: Registrar el listener ANTES de cualquier operación
    client.on("call.ring", handleIncomingCall);
    console.log("✅ Listener registrado para call.ring");

    return () => {
      console.log("🔇 Desregistrando listener call.ring");
      client.off("call.ring", handleIncomingCall);
    };
  }, [client, currentUser]);

  // =========================================================
  // 🔹 Iniciar el cliente con un usuario + token manual
  // =========================================================
  const initClient = async (user) => {
    try {
      const streamClient = new StreamVideoClient({
        apiKey,
      });

      console.log("🔌 Conectando usuario:", user.name);

      await streamClient.connectUser(
        {
          id: user.id,
          name: user.name,
        },
        user.token
      );

      console.log("✅ Usuario conectado:", user.name);

      setClient(streamClient);
      setCurrentUser(user);
    } catch (error) {
      console.error("❌ Error al conectar usuario:", error);
    }
  };

  // =========================================================
  // 🔹 Crear llamada entre currentUser → otro usuario
  // =========================================================
  const startCall = async (calleeId) => {
    try {
      // Genera un ID consistente basado en los dos usuarios
      const userIds = [currentUser.id, calleeId].sort();
      const callId = `call-${userIds[0]}-${userIds[1]}`;
      
      console.log("📞 Iniciando llamada:", { callId, caller: currentUser.id, callee: calleeId });
      
      const newCall = client.call("default", callId);

      // ✅ Primero crear/obtener la llamada con ring: true
      const response = await newCall.getOrCreate({
        data: {
          members: [
            { user_id: currentUser.id },
            { user_id: calleeId },
          ],
        },
        ring: true, // 🔔 Esto envía notificación de llamada
      });

      console.log("✅ Llamada creada:", response);

      // ✅ Pequeña pausa para asegurar que el servidor procese el ring
      await new Promise(resolve => setTimeout(resolve, 100));

      // Unirse a la llamada después de crearla
      await newCall.join();
      console.log("✅ Unido a la llamada");

      setCall(newCall);
    } catch (error) {
      console.error("❌ Error al crear la llamada:", error);
      console.error("❌ Detalles:", error.message, error.code);
    }
  };

  // =========================================================
  // 🔹 Pantalla inicial: Elegir usuario
  // =========================================================
  if (!client) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Elige tu usuario para iniciar sesión</h2>

        {fakeUsers.map((u) => (
          <button
            key={u.id}
            onClick={() => initClient(u)}
            style={{ display: "block", margin: "10px 0" }}
          >
            Entrar como {u.name}
          </button>
        ))}
      </div>
    );
  }

  // =========================================================
  // 🔹 Lista de usuarios para llamar
  // =========================================================
  if (!call) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Usuarios disponibles</h2>

        {/* 🔔 Notificación de llamada entrante */}
        {incomingCall && (
          <div
            style={{
              padding: 20,
              background: "#4CAF50",
              color: "white",
              marginBottom: 20,
              borderRadius: 8,
            }}
          >
            <h3>📞 Llamada entrante</h3>
            <p>Alguien te está llamando</p>
            <button
              style={{ marginRight: 10, padding: "10px 20px" }}
              onClick={async () => {
                await incomingCall.join();
                setCall(incomingCall);
                setIncomingCall(null);
              }}
            >
              ✅ Aceptar
            </button>
            <button
              style={{ padding: "10px 20px" }}
              onClick={async () => {
                await incomingCall.reject();
                setIncomingCall(null);
              }}
            >
              ❌ Rechazar
            </button>
          </div>
        )}

        {fakeUsers
          .filter((u) => u.id !== currentUser.id)
          .map((u) => (
            <div key={u.id} style={{ marginBottom: 15 }}>
              {u.name}
              <button
                style={{ marginLeft: 15 }}
                onClick={() => startCall(u.id)}
              >
                Llamar
              </button>
            </div>
          ))}
      </div>
    );
  }

  console.log("CALL:", call);

  // =========================================================
  // 🔹 UI de la llamada
  // =========================================================
  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <VideoUI />
        <CallControls />
      </StreamCall>
    </StreamVideo>
  );
}

// =========================================================
// 🔹 Componente separado para acceder a los hooks
// =========================================================
function VideoUI() {
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();

  console.log("Participantes:", participants);

  if (participants.length === 0) {
    return (
      <div style={{ padding: 20, textAlign: "center" }}>
        <h3>Esperando participantes...</h3>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 20, padding: 20, flexWrap: "wrap" }}>
      {participants.map((p) => (
        <div key={p.sessionId} style={{ minWidth: "300px" }}>
          <ParticipantView participant={p} />
        </div>
      ))}
    </div>
  );
}

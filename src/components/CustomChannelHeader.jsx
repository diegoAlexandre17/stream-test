import { Avatar, useChannelStateContext } from "stream-chat-react";

export default function CustomChannelHeader({ 
  currentUser, 
  videoClient, 
  setActiveCall, 
  setIsCallActive 
}) {
  const { channel } = useChannelStateContext();

  const handleStartCall = async () => {
    const otherMember = Object.values(channel.state.members).find(
      (member) => member.user.id !== currentUser.id
    );

    if (otherMember) {
      console.log("📞 Iniciando llamada con:", otherMember.user.name);
      console.log("👤 Miembros:", currentUser.id, "y", otherMember.user.id);
      
      const callType = "default";
      const userIds = [currentUser.id, otherMember.user.id].sort();
      const callId = `call-${userIds[0]}-${userIds[1]}`;
      const call = videoClient.call(callType, callId);
      
      try {
        // Crear la llamada con ring para notificar al otro usuario
        await call.getOrCreate({
          ring: true,
          data: {
            members: [
              { user_id: userIds[0] },
              { user_id: userIds[1] }
            ],
            created_by_id: currentUser.id,
          },
        });

        console.log("✅ Llamada creada y notificación enviada:", callId);
        
        // 🔥 USER A (quien inicia) entra INMEDIATAMENTE a la sala
        await call.join();
        console.log("✅ User A entró a la sala, esperando a User B...");
        
        setActiveCall(call);
        setIsCallActive(true);
      } catch (error) {
        console.error("❌ Error al crear/unirse a la llamada:", error);
      }
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
}

import { Avatar } from "stream-chat-react";

export default function CustomChannelPreview(props) {
  const { channel, setActiveChannel, activeChannel } = props;

  const { messages } = channel.state;
  const messagePreview = messages[messages.length - 1]?.text?.slice(0, 30);
  const isActive = activeChannel?.id === channel.id;
  const unreadCount = channel.countUnread();

  const handleDeleteChat = async (e) => {
    e.stopPropagation();
    
    const confirmDelete = window.confirm(
      `¿Estás seguro de que quieres ocultar este chat? Volverá a aparecer si recibes nuevos mensajes.`
    );
    
    if (confirmDelete) {
      try {
        console.log("🗑️ Ocultando canal:", channel.id);
        
        await channel.hide();
        
        console.log("✅ Canal ocultado");
        
        if (isActive) {
          setActiveChannel?.(null);
        }
      } catch (error) {
        console.error("❌ Error al ocultar el canal:", error);
        alert("No se pudo ocultar el chat. Intenta nuevamente.");
      }
    }
  };

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
        alignItems: "center",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        const deleteBtn = e.currentTarget.querySelector('.delete-btn');
        if (deleteBtn) deleteBtn.style.opacity = '1';
      }}
      onMouseLeave={(e) => {
        const deleteBtn = e.currentTarget.querySelector('.delete-btn');
        if (deleteBtn) deleteBtn.style.opacity = '0';
      }}
    >
      <div style={{ position: "relative" }}>
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
          <div style={{ fontSize: "14px", color: unreadCount > 0 ? "#000" : "#666" }}>
            {messagePreview}
          </div>
        ) : (
          <div style={{ fontSize: "14px", color: "#aaa" }}>
            No messages yet
          </div>
        )}
      </div>
      {unreadCount > 0 && (
        <div
          style={{
            backgroundColor: "#ff4444",
            color: "white",
            borderRadius: "50%",
            minWidth: "24px",
            height: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            fontWeight: "600",
            padding: "0 6px",
            marginRight: "8px",
          }}
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </div>
      )}
      <button
        className="delete-btn"
        onClick={handleDeleteChat}
        style={{
          opacity: 0,
          transition: "opacity 0.2s",
          backgroundColor: "#ff4444",
          color: "white",
          border: "none",
          borderRadius: "50%",
          width: "28px",
          height: "28px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "16px",
          flexShrink: 0,
        }}
        title="Ocultar chat"
      >
        🗑️
      </button>
    </div>
  );
}

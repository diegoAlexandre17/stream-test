import { Avatar } from "stream-chat-react";

const formatMessageDate = (date) => {
  if (!date) return "";
  
  const messageDate = new Date(date);
  const day = String(messageDate.getDate()).padStart(2, '0');
  const month = String(messageDate.getMonth() + 1).padStart(2, '0');
  const year = messageDate.getFullYear();
  const hours = String(messageDate.getHours()).padStart(2, '0');
  const minutes = String(messageDate.getMinutes()).padStart(2, '0');
  
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

export default function CustomChannelPreview(props) {
  const { channel, setActiveChannel, activeChannel } = props;

  const { messages } = channel.state;
  const messagePreview = messages[messages.length - 1]?.text?.slice(0, 30);
  const messageHours = formatMessageDate(messages[messages.length - 1]?.created_at);
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
      className={`${
        isActive ? "active-channel" : "transparent"
      } channel-container`}
      onMouseEnter={(e) => {
        const deleteBtn = e.currentTarget.querySelector(".delete-btn");
        if (deleteBtn) deleteBtn.style.opacity = "1";
      }}
      onMouseLeave={(e) => {
        const deleteBtn = e.currentTarget.querySelector(".delete-btn");
        if (deleteBtn) deleteBtn.style.opacity = "0";
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
          <div
            style={{
              fontSize: "14px",
              color: unreadCount > 0 ? "#000" : "#666",
            }}
          >
            <div className="d-flex justify-content-between">
              <div>{messagePreview}</div>
              <div>
                <small>{messageHours}</small>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: "14px", color: "#aaa" }}>No messages yet</div>
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
      {/* <button
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
      </button> */}
    </div>
  );
}

import { 
  MessageText, 
  MessageStatus, 
  useMessageContext,
  Avatar 
} from "stream-chat-react";

export default function CustomMessage() {
  const { message, isMyMessage } = useMessageContext();
  
  const hasAttachments = message.attachments && message.attachments.length > 0;
  const hasText = message.text && message.text.trim() !== '';

  return (
    <div
      style={{
        display: "flex",
        flexDirection: isMyMessage() ? "row-reverse" : "row",
        gap: "8px",
        marginBottom: "12px",
        padding: "0 16px",
      }}
    >
      {/* Avatar */}
      <Avatar
        image={message.user?.image}
        name={message.user?.name || message.user?.id}
        size={32}
      />

      {/* Contenido del mensaje */}
      <div
        style={{
          maxWidth: "70%",
          display: "flex",
          flexDirection: "column",
          alignItems: isMyMessage() ? "flex-end" : "flex-start",
        }}
      >
        {/* Nombre del usuario (solo si no es mi mensaje) */}
        {!isMyMessage() && (
          <span
            style={{
              fontSize: "12px",
              color: "#666",
              marginBottom: "4px",
              paddingLeft: "12px",
            }}
          >
            {message.user?.name || message.user?.id}
          </span>
        )}

        {/* Burbuja del mensaje */}
        <div
          style={{
            backgroundColor: isMyMessage() ? "#007bff" : "#f1f3f4",
            color: isMyMessage() ? "white" : "#000",
            borderRadius: "18px",
            padding: hasAttachments ? "8px" : "10px 14px",
            wordBreak: "break-word",
          }}
        >
          {/* Attachments (imágenes y archivos) */}
          {hasAttachments && (
            <div style={{ marginBottom: hasText ? "8px" : "0" }}>
              {message.attachments.map((attachment, index) => {
                if (attachment.type === "image" && attachment.image_url) {
                  return (
                    <a
                      key={index}
                      href={attachment.image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: "block", marginBottom: "4px" }}
                    >
                      <img
                        src={attachment.image_url}
                        alt={attachment.fallback || "Imagen"}
                        style={{
                          maxWidth: "300px",
                          maxHeight: "300px",
                          borderRadius: "12px",
                          display: "block",
                        }}
                      />
                    </a>
                  );
                } else if (attachment.type === "file" && attachment.asset_url) {
                  return (
                    <a
                      key={index}
                      href={attachment.asset_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "8px 12px",
                        backgroundColor: isMyMessage() ? "rgba(255,255,255,0.2)" : "white",
                        borderRadius: "8px",
                        textDecoration: "none",
                        color: isMyMessage() ? "white" : "#000",
                        marginBottom: "4px",
                      }}
                    >
                      <span style={{ fontSize: "20px" }}>📄</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: "500",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {attachment.title || "Archivo adjunto"}
                        </div>
                        {attachment.file_size && (
                          <div style={{ fontSize: "11px", opacity: 0.8 }}>
                            {(attachment.file_size / 1024).toFixed(0)} KB
                          </div>
                        )}
                      </div>
                    </a>
                  );
                }
                return null;
              })}
            </div>
          )}

          {/* Texto del mensaje */}
          {hasText && (
            <div style={{ padding: hasAttachments ? "0 6px 2px 6px" : "0" }}>
              <MessageText />
            </div>
          )}
        </div>

        {/* Estado del mensaje (visto, enviado, etc) */}
        <div style={{ fontSize: "11px", marginTop: "2px", paddingLeft: "12px" }}>
          <MessageStatus />
        </div>
      </div>
    </div>
  );
}

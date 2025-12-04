import { useState, useRef } from "react";
import { useChannelStateContext } from "stream-chat-react";
import { InputGroup, Input, Button } from "reactstrap";

export default function CustomMessageInput() {
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState([]);
  const { channel } = useChannelStateContext();
  const fileInputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if ((!message.trim() && attachments.length === 0) || !channel) return;

    try {
      // Subir archivos a Stream primero
      const uploadedAttachments = [];
      
      for (const att of attachments) {
        try {
          let response;
          if (att.type.startsWith('image/')) {
            response = await channel.sendImage(att.file);
            uploadedAttachments.push({
              type: 'image',
              image_url: response.file,
              fallback: att.name,
            });
          } else {
            response = await channel.sendFile(att.file);
            uploadedAttachments.push({
              type: 'file',
              asset_url: response.file,
              title: att.name,
              file_size: att.size,
              mime_type: att.type,
            });
          }
        } catch (uploadError) {
          console.error("Error al subir archivo:", uploadError);
        }
      }

      // Enviar mensaje con archivos subidos
      await channel.sendMessage({
        text: message.trim(),
        attachments: uploadedAttachments,
      });
      
      // Limpiar URLs temporales
      attachments.forEach(att => URL.revokeObjectURL(att.url));
      
      setMessage("");
      setAttachments([]);
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length > 0) {
      const newAttachments = files.map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file),
        file: file,
      }));
      
      setAttachments(prev => [...prev, ...newAttachments]);
      
      // Resetear el input para poder seleccionar el mismo archivo nuevamente
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeAttachment = (id) => {
    setAttachments(prev => {
      const updated = prev.filter(att => att.id !== id);
      // Liberar URL del objeto
      const removed = prev.find(att => att.id === id);
      if (removed) {
        URL.revokeObjectURL(removed.url);
      }
      return updated;
    });
  };

  return (
    <div 
      style={{ 
        padding: "12px 16px",
        backgroundColor: "white",
        borderTop: "1px solid #e0e0e0"
      }}
    >
      {/* Preview de adjuntos */}
      {attachments.length > 0 && (
        <div 
          style={{ 
            marginBottom: "12px",
            display: "flex",
            flexWrap: "wrap",
            gap: "8px"
          }}
        >
          {attachments.map(att => (
            <div
              key={att.id}
              style={{
                position: "relative",
                display: "inline-block",
                border: "1px solid #dee2e6",
                borderRadius: "8px",
                padding: "8px",
                backgroundColor: "#f8f9fa",
                maxWidth: att.type.startsWith('image/') ? "120px" : "200px"
              }}
            >
              {att.type.startsWith('image/') ? (
                <img
                  src={att.url}
                  alt={att.name}
                  style={{
                    width: "100px",
                    height: "100px",
                    objectFit: "cover",
                    borderRadius: "4px",
                    display: "block"
                  }}
                />
              ) : (
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "8px",
                  fontSize: "14px" 
                }}>
                  <span style={{ fontSize: "20px" }}>📄</span>
                  <span style={{ 
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: "150px"
                  }}>
                    {att.name}
                  </span>
                </div>
              )}
              <button
                type="button"
                onClick={() => removeAttachment(att.id)}
                style={{
                  position: "absolute",
                  top: "-6px",
                  right: "-6px",
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  border: "none",
                  backgroundColor: "#dc3545",
                  color: "white",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  fontWeight: "bold",
                  padding: 0
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <InputGroup>
          <Button
            color="light"
            onClick={handleAttachClick}
            type="button"
            style={{
              border: "1px solid #ced4da",
              borderRight: "none",
              backgroundColor: "white",
              color: "#6c757d",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0.375rem 0.75rem"
            }}
          >
            📎
          </Button>
          
          <Input
            type="text"
            placeholder="Escribe un mensaje..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            style={{
              border: "1px solid #ced4da",
              borderLeft: "none",
              borderRight: "none",
            }}
          />
          
          <Button
            color="success"
            type="submit"
            style={{
              backgroundColor: "#28a745",
              border: "1px solid #28a745",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "0.375rem 1rem"
            }}
          >
            Enviar
            <span style={{ fontSize: "16px" }}>✈️</span>
          </Button>
        </InputGroup>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
      </form>
    </div>
  );
}

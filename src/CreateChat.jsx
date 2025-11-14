import React, { useState } from 'react';
import { useChatContext } from 'stream-chat-react';
import { StreamChat } from 'stream-chat';

const CreateChat = () => {
  const { client } = useChatContext();
  const [otherUserId, setOtherUserId] = useState('');
  const [otherUserName, setOtherUserName] = useState('');

  const handleCreateUserAndChannel = async () => {
    try {
      if (!client?.userID) {
        alert('El cliente no está conectado todavía.');
        return;
      }

      if (!otherUserId) return alert('Ingresa un ID de usuario');
      if (!otherUserName) return alert('Ingresa un nombre de usuario');

      console.log('Paso 1: Creando usuario...');
      
      // 👇 Crear un cliente temporal nuevo (no reutilizar instancia)
      const tempClient = new StreamChat('n2s9ec2gep9x');
      
      try {
        // Conectar el nuevo usuario temporalmente para crearlo en Stream
        await tempClient.connectUser(
          {
            id: otherUserId,
            name: otherUserName,
          },
          tempClient.devToken(otherUserId)
        );
        
        console.log(`Usuario ${otherUserId} conectado y creado`);
        
        // Esperar un momento para asegurar sincronización
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Desconectar el usuario temporal
        await tempClient.disconnectUser();
        
        console.log(`Usuario ${otherUserId} desconectado`);
      } catch (userErr) {
        console.log('Error al crear usuario:', userErr.message);
        // Si el usuario ya existe, continuar
        if (!userErr.message.includes('already exists')) {
          throw userErr;
        }
      }

      console.log('Paso 2: Verificando que el usuario exista...');
      
      // Verificar que el usuario realmente existe antes de crear el canal
      const { users } = await client.queryUsers({ id: otherUserId });
      
      if (users.length === 0) {
        throw new Error(`El usuario ${otherUserId} no se creó correctamente. Intenta de nuevo.`);
      }
      
      console.log('Paso 3: Creando canal...');

      // 👇 Ahora crear el canal con ambos usuarios
      const newChannel = client.channel('messaging', {
        name: `Chat con ${otherUserName}`,
        members: [client.userID, otherUserId],
      });

      await newChannel.watch();

      alert(`¡Canal creado exitosamente!\nID: ${newChannel.id}`);
      
      // Limpiar inputs
      setOtherUserId('');
      setOtherUserName('');
      
    } catch (err) {
      console.error('Error al crear canal:', err);
      alert('Error: ' + err.message);
    }
  };

  return (
    <div style={{ 
      margin: '1rem', 
      padding: '1rem', 
      border: '1px solid #ccc', 
      borderRadius: '8px',
      backgroundColor: '#f9f9f9'
    }}>
      <h3>Crear nuevo usuario y canal</h3>
      <div style={{ marginBottom: '8px' }}>
        <input
          type="text"
          placeholder="ID del usuario (ej: diego)"
          value={otherUserId}
          onChange={(e) => setOtherUserId(e.target.value)}
          style={{ marginRight: '8px', padding: '8px', width: '200px' }}
        />
      </div>
      <div style={{ marginBottom: '8px' }}>
        <input
          type="text"
          placeholder="Nombre del usuario (ej: Diego)"
          value={otherUserName}
          onChange={(e) => setOtherUserName(e.target.value)}
          style={{ marginRight: '8px', padding: '8px', width: '200px' }}
        />
      </div>
      <button 
        onClick={handleCreateUserAndChannel}
        style={{ padding: '8px 16px', cursor: 'pointer' }}
      >
        Crear Usuario y Canal
      </button>
    </div>
  );
};

export default CreateChat;

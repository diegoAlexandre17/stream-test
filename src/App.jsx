/* import { useState, useEffect } from 'react';
import { useCreateChatClient, Chat, Channel, ChannelHeader, MessageInput, MessageList, Thread, Window } from 'stream-chat-react';
import 'stream-chat-react/dist/css/v2/index.css';
import './layout.css';

import 'stream-chat-react/dist/css/v2/index.css';

const apiKey = 'dz5f4d5kzrue';
const userId = 'shrill-rice-5';
const userName = 'shrill';
const userToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoic2hyaWxsLXJpY2UtNSIsImV4cCI6MTc2MjgxNjk3OH0.ZcYvVLeG74ryNAJZyDqMs1QyFY8nu_u0n2YoefRz7sY';

const user= {
  id: userId,
  name: userName,
  image: `https://getstream.io/random_png/?name=${userName}`,
};

const App = () => {
  const [channel, setChannel] = useState();
  const client = useCreateChatClient({
    apiKey,
    tokenOrProvider: userToken,
    userData: user,
  });

  useEffect(() => {
    if (!client) return;

    const channel = client.channel('messaging', 'custom_channel_id', {
      image: 'https://getstream.io/random_png/?name=react',
      name: 'Talk about React',
      members: [userId],
    });

    setChannel(channel);
  }, [client]);

  if (!client) return <div>Setting up client & connection...</div>;

  return (
    <Chat client={client}>
      <Channel channel={channel}>
        <Window>
          <ChannelHeader />
          <MessageList />
          <MessageInput />
        </Window>
        <Thread />
      </Channel>
    </Chat>
  );
};

export default App; */

import {
  Chat,
  Channel,
  ChannelHeader,
  ChannelList,
  MessageInput,
  MessageList,
  Thread,
  Window,
  useMessageContext,
  useCreateChatClient,
  useChannelStateContext,
  useMessageInputContext,
} from "stream-chat-react";

import "./layout.css";
import { useEffect, useState } from "react";
import { StreamChat } from "stream-chat";
import CreateChat from "./CreateChat";

const CustomHeader = () => {
  const { channel } = useChannelStateContext();

  return (
    <div>
      <img style={{ height: "36px" }} src={channel.data.image} />
      <p>{channel.data.name}</p>
    </div>
  );
};

const App = () => {
  const userId = "usuario-2";

  const sort = { last_message_at: -1 };
  const filters = {
    type: "messaging",
    members: { $in: [userId] },
  };
  const options = {
    limit: 10,
    presence: true,
    state: true,
    watch: true,
  };

  const [client, setClient] = useState(null);

  useEffect(() => {
    const init = async () => {
      const chatClient = StreamChat.getInstance("n2s9ec2gep9x");

      // 👇 Conectar usuario (dev token, solo para pruebas sin backend)
      await chatClient.connectUser(
        {
          id: "usuario-2",
          name: "Usuario 1",
        },
        chatClient.devToken("usuario-2")
      );

      setClient(chatClient);
    };

    init();

    // Limpieza cuando el componente se desmonta
    return () => {
      if (client) client.disconnectUser();
    };
  }, []);

  /*  const CustomChannelPreview = (props) => {
    const { channel, setActiveChannel } = props;

    console.log("Channel en Preview:", channel);

    const { messages } = channel.state;
    const messagePreview = messages[messages.length - 1]?.text?.slice(0, 30);

    console.log("Mensaje preview:", messages[messages.length - 1]);

    return (
      <div
        onClick={() => setActiveChannel?.(channel)}
        style={{ margin: "12px", display: "flex", gap: "5px" }}
      >
        <div>
          <img
            src={channel.data?.image}
            alt="channel-image"
            style={{ height: "36px" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <div>{channel.data?.name || "Unnamed Channel"}</div>
          {messagePreview && (
            <div style={{ fontSize: "14px" }}>{messagePreview}</div>
          )}
        </div>
      </div>
    );
  }; */

  const CustomChannelPreview = ({ channel, setActiveChannel }) => {
    const members = Object.values(channel.state.members);
    const other = members.find((m) => m.user.id !== channel._client.userID);
    const user = other?.user;

    const { messages } = channel.state;
    const lastMessage = messages[messages.length - 1];
    const messagePreview = lastMessage?.text?.slice(0, 30);
    const lastMessageTime = lastMessage
      ? new Date(lastMessage.created_at)
      : null;

    return (
      <div
        onClick={() => setActiveChannel(channel)}
        style={{
          display: "flex",
          alignItems: "center",
          padding: "12px",
          borderBottom: "1px solid #e0e0e0",
          cursor: "pointer",
          transition: "background-color 0.2s",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = "#f5f5f5")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.backgroundColor = "transparent")
        }
      >
        <div style={{ position: "relative", marginRight: "12px" }}>
          <img
            src={
              user?.image ||
              "https://images.unsplash.com/photo-1640951613773-54706e06851d?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            }
            alt="avatar"
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              objectFit: "cover",
            }}
          />
          {/* Círculo de estado online/offline */}
          <span
            style={{
              position: "absolute",
              bottom: "0px",
              right: "0px",
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              backgroundColor: user?.online ? "#4CAF50" : "#9E9E9E",
              border: "2px solid white",
              boxShadow: "0 0 4px rgba(0,0,0,0.2)",
            }}
            title={user?.online ? "En línea" : "Desconectado"}
          ></span>
        </div>
        <div style={{ flex: 1 }}>
          <strong>{user?.name || "Sin nombre"}</strong>
          {messagePreview && <div>{messagePreview}</div>}
          {lastMessageTime && <div>{lastMessageTime.toLocaleString()}</div>}
        </div>
      </div>
    );
  };

  if (!client) return <div>Cargando chat...</div>;

  return (
    <Chat client={client}>
      <ChannelList
        Preview={CustomChannelPreview}
        filters={filters}
        sort={sort}
        options={options}
      />
      <Channel >
        <Window>
          {/* <ChannelHeader /> */}
          <CustomHeader />
          <MessageList />
          <MessageInput />
        </Window>
        <Thread />
      </Channel>

      <CreateChat currentUserId={userId} />
    </Chat>
  );
};

export default App;

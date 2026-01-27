'use client'
import React, { useContext, useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation';
import { io } from 'socket.io-client'
import { FaTimes, FaTimesCircle, FaTrash } from "react-icons/fa";
import { BsFillSendFill } from "react-icons/bs";
import { UserData } from '@/app/context';
import { BsEmojiSmile } from "react-icons/bs";
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { RxExit } from "react-icons/rx";
import { GiSpiderMask } from "react-icons/gi";
import { MdDarkMode, MdOutlineLightMode } from "react-icons/md";
import SwipeableChats from '@/components/ui/swipableChats';


const socket = io(`wss://${process.env.NEXT_PUBLIC_BACKEND_ENDPOINT}`);

type Chat = {
  message: string,
  timestamp: string,
  sender: string,
  side: boolean,
  messageType: string,
  reply?: {
    sender: string
    message: string
  },
  shadowId?: string
  __v?: number
  _id?: string
}

type Reaction = {
  reaction: string,
  reactor: string
}


type Reactions = {
  reactions: Reaction[],
  chatId: string,
  shadowId: string
}

export default function Chat() {
  const [shadowText, setShadowText] = useState('');
  const [roomId, setRoomId] = useState<string>();
  const [notification, setNotification] = useState('');
  const [active, setActive] = useState('');
  const [messageData, setMessageData] = useState<Chat[]>([]);
  const [auth, setAuth] = useContext(UserData);
  const route = useRouter();
  const chatScroll = useRef<any>(null);
  const [showEmojis, setShowEmojis] = useState(false);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [reactions, setReactions] = useState<Reactions[]>([]);
  const [reactionTarget, setReactionTarget] = useState<string | null>(null);
  const [showQuickReactions, setShowQuickReactions] = useState(false);

  // 🌞 THEME STATE
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) setTheme(savedTheme);
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    socketInitailization();
    const audio = new Audio('/sounds/mixkit-correct-answer-tone-2870.mp3');
    audio.play();

    return () => {
      socket.off('chat');
      socket.off('joined');
      socket.off('population');
      socket.off('prevMessages');
      socket.off('prevReactions');
    };
  }, []);

  useEffect(() => {
    setTimeout(() => setNotification(''), 5000);
  }, [notification]);

  useEffect(() => {
    if (chatScroll.current) {
      chatScroll.current.scrollTop = chatScroll.current.scrollHeight;
    }
  }, [messageData]);

  const socketInitailization = () => {
    const id: any = localStorage.getItem('shadowId');
    setRoomId(id);
    if (auth || id === 'general') {
      socket.emit('roomId', id);

      socket.on('joined', (data: any) => setNotification(data));
      socket.on('population', (data: any) => setActive(data));
      socket.on('prevMessages', (data: any) => {
        setMessageData(data);
        chatScroll.current.scrollTop = chatScroll.current.scrollHeight;
      });
      socket.on('prevReactions', (data: any) => setReactions(data));

      // const audio = new Audio('/sounds/mixkit-gaming-lock-2848.wav');
      socket.on('chat', (data: Chat) => {
        const id = localStorage.getItem('uniqueUser');
        const side = data.sender === id ? true : false;
        // if (!side) audio.play();
        setMessageData((prev) => [...prev, { ...data, side }]);
      });
    } else {
      route.push('/join');
    }
  };

  const handleSubmitText = (e: any) => {
    e.preventDefault();
    const messageType = selectedChat ? 'replyText' : 'text';
    const time = new Date();
    const hour = time.getHours();
    const min = time.getMinutes();
    const currentTime = hour + ':' + min;
    const id: any = localStorage.getItem('shadowId');
    const user: any = localStorage.getItem('uniqueUser');
    socket.emit('text', {
      message: shadowText,
      rooms: id,
      user,
      time: currentTime,
      messageType,
      reply: selectedChat
        ? { sender: selectedChat.sender, message: selectedChat.message }
        : null,
    });
    setSelectedChat(null);
    setShadowText('');
  };

  const handleTextChange = (e: any) => {
    setShadowText(e.target.value);
    socket.emit('typing', { rooms: roomId });
  };

  useEffect(() => {
    socket.on('typing', (data: any) => setNotification(data));
  }, [roomId]);

  const handleGlobalReaction = (emoji: any) => {
    if (!reactionTarget) return;
    const targetMessage = messageData.find((m) => m._id === reactionTarget);
    const reactionObj = {
      reaction: {
        reaction: emoji.id,
        reactor: localStorage.getItem('uniqueUser'),
      },
      chatId: reactionTarget,
      rooms: targetMessage?.shadowId || roomId,
    };
    socket.emit('reaction', reactionObj);
    setReactionTarget(null);
    setShowQuickReactions(false);
  };

  const handleLeave = () => {
    localStorage.setItem('shadowId', '');
    route.push('/');
  };

  // 🌗 Theme classes
  const bgColor =
    theme === 'dark' ? 'bg-black text-gray-300' : 'bg-gray-100 text-gray-800';
  const headerColor =
    theme === 'dark' ? 'bg-black text-gray-600' : 'bg-white text-gray-700';
  const bubbleColor = theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200';

  return (
    <section
      style={{
        backgroundImage:
          theme === 'dark' ? 'url("/images/w3.jpg")' : 'url("/images/light-bg.jpg")',
        backgroundPosition: 'no-repeat',
        backgroundSize: 'cover',
        transition: 'all 0.4s ease',
      }}
      className={` sm:w-[30vw] mx-auto relative transition-all duration-500`}
    >
      <div
        className={`absolute top-0 w-full text-center z-50 ${headerColor} transition-all duration-500`}
      >
        <div className="py-3 px-4 text-center w-full font-bold text-xl flex justify-between items-center">
          <h1 className="text-xl font-bold">Shadow</h1>
          <div className="flex items-center gap-6">
            <button
              onClick={toggleTheme}
              className="text-xl font-bold hover:opacity-80 transition"
            >
              {theme === 'dark' ? <MdOutlineLightMode /> : <MdDarkMode />}
            </button>
            <button className="text-red-700 font-extrabold" onClick={handleLeave}>
              <RxExit />
            </button>
          </div>
        </div>
        <div className="text-2xl w-full -translate-y-3 flex justify-center">
          <GiSpiderMask />
        </div>

        <div className="text-sm">{active}</div>
        <p className="text-sm italic">{notification}</p>
      </div>

      <div
        ref={chatScroll}
        className={`pt-24 h-[91dvh] ${selectedChat ? 'pb-24' : ''
          } overflow-y-scroll ${bgColor}/20 transition-all duration-500`}
      >
        <div className="py-3 px-5">
          {messageData.length > 0 ? (
            <SwipeableChats
              chat={messageData}
              reactions={reactions}
              setSelectedChat={setSelectedChat}
              setReactionTarget={setReactionTarget}
              setShowQuickReactions={setShowQuickReactions}
              socket={socket}
            />
          ) : (
            <p className={`w-full ${theme === 'dark' && 'text-gray-500'} h-full flex justify-center items-center text-sm`}>
              No echoes in the shadows yet...
            </p>
          )}
        </div>
      </div>

      {showQuickReactions && reactionTarget && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-fit backdrop-blur-xl rounded-xl p-3 pr-10 flex flex-col gap-3 z-[9999]">
          <span className="text-gray-500 text-xs">Quick Reactions</span>
          <Picker
            reactionsDefaultOpen={true}
            perLine={5}
            emojiSize={15}
            onClickOutside={() => {
              setReactionTarget(null);
              setShowQuickReactions(false);
            }}
            data={data}
            previewPosition={'none'}
            onEmojiSelect={(emoji: any) => handleGlobalReaction(emoji)}
          />
          <button
            onClick={() => {
              setReactionTarget(null);
              setShowQuickReactions(false);
            }}
            className="w-fit ml-auto text-sm font-semibold absolute top-2 right-2"
          >
            <FaTimes />
          </button>
        </div>
      )}

      {selectedChat && (
        <div className="absolute bottom-16 w-full px-4 z-50">
          <div
            className={`
        relative w-fit max-w-[85%]
        px-3 py-5 pr-10
        flex flex-col gap-1
        rounded-2xl shadow-md
        border-l-4
        ${selectedChat.side
                ? "ml-auto bg-[#005c4b]/90 text-white border-l-[#25d366]"
                : "mr-auto bg-[#202c33] text-gray-100 border-l-[#8696a0]"}
      `}
          >
            {/* Header */}
            <span className="text-[11px] font-medium text-gray-300">
              Replying to {selectedChat.side ? "Me" : selectedChat.sender}
            </span>

            {/* Preview text */}
            <p className="text-[13px] text-gray-200 line-clamp-2">
              {selectedChat.message}
            </p>

            {/* Close button */}
            <button
              onClick={() => setSelectedChat(null)}
              className="
          absolute top-2 right-2
          text-gray-400 hover:text-white
          transition-colors
        "
            >
              <FaTimes size={12} />
            </button>
          </div>
        </div>
      )}

      <div className={`w-full px-3 py-3 relative ${bgColor}`}>
        <form className="flex items-center justify-between">
          <button
            onClick={(e: any) => {
              e.preventDefault();
              setShowEmojis(!showEmojis);
            }}
          >
            <BsEmojiSmile className="text-2xl font-semibold cursor-pointer" />
          </button>
          {showEmojis && (
            <div className="absolute bottom-20 z-40">
              <Picker
                data={data}
                dynamicWidth={false}
                previewPosition="none"
                perLine={7}
                emojiSize={20}
                onClickOutside={() => setShowEmojis(false)}
                onEmojiSelect={(emoji: any) =>
                  setShadowText(shadowText + emoji.native)
                }
              />
            </div>
          )}
          <input
            type="text"
            onChange={(e: any) => handleTextChange(e)}
            value={shadowText}
            className={`px-3 py-2 w-10/12 focus:border-b-2 focus:outline-none ${theme === 'dark'
              ? 'bg-black text-white border-gray-700'
              : 'bg-white text-gray-800 border-gray-300'
              }`}
            placeholder="Type here..."
          />
          {shadowText && (
            <button onClick={handleSubmitText} className="mx-5">
              <BsFillSendFill className="text-2xl" />
            </button>
          )}
        </form>
      </div>
    </section>
  );
}


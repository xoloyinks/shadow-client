'use client'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation';
import { io } from 'socket.io-client'
import { FaTimes } from "react-icons/fa";
import { BsFillSendFill } from "react-icons/bs";
import { UserData } from '@/app/context';
import { BsEmojiSmile } from "react-icons/bs";
import axios from 'axios';
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { useSwipeable } from 'react-swipeable';

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

type SwipeableChatsProps = {
  chat: Chat[];
  setSelectedChat: (chat: Chat) => void;
};

const SwipeableChatItem: React.FC<{ datum: Chat, setSelectedChat: (chat: Chat) => void }> = ({ datum, setSelectedChat }) => {
  const [translateX, setTranslateX] = useState(0);
  const handlers = useSwipeable({
    onSwiping: (eventData) => {
      const move = Math.max(Math.min(eventData.deltaX, 60), -60);
      setTranslateX(move);
    },
    onSwiped: (eventData) => {
      console.log(eventData)
      if(eventData.deltaX > 50){
        setSelectedChat(datum);
      }
      
      if (eventData.absX > 200) {
        setTranslateX(eventData.deltaX > 0 ? 60 : -60);
        setTimeout(() => {
          setTranslateX(0);
        }, 200);
      } else {
        setTranslateX(0);
      }
    },
    preventScrollOnSwipe: true,
    trackMouse: true,
  });

  if (datum.messageType === 'text') {
    return (
      <p
        {...handlers}
        style={{
          transform: `translateX(${translateX}px)`,
          transition: translateX === 0 ? "transform 0.2s ease-out" : "none",
        }}
        className={`text-gray-400 mb-2 px-2 mx-2 w-fit max-w-[60%] py-2 bg-gray-800 flex min-w-[100px] flex-col-reverse gap-2 rounded-xl ${datum.side ? 'rounded-br-none ml-auto' : 'mr-auto rounded-bl-none'}`}>
        <span className='mr-2 text-[12px] font-semibold bottom-0 text-right'>{datum.timestamp}</span>
        <span className='tracking-wide text-sm'>{datum.message}</span>
        <span className='text-sm font-semibold text-gray-500'>{datum.side ? "Me" : datum.sender}</span>
      </p>
    );
  } else if (datum.messageType === 'replyText') {
    return (
      <div
        {...handlers}
        style={{
          transform: `translateX(${translateX}px)`,
          transition: translateX === 0 ? "transform 0.2s ease-out" : "none",
        }}
        className={`text-gray-400 mb-2 px-2 mx-2 w-fit max-w-[60%] py-2 bg-gray-800 flex flex-col gap-2 rounded-xl ${datum.side ? 'rounded-br-none ml-auto' : 'mr-auto rounded-bl-none'}`}>
        <span className='text-sm font-semibold text-gray-500'>{datum.side ? "Me" : datum.sender}</span>
        <div className='pl-2 border-l-2 border-gray-600'>
          <span className='text-sm text-gray-500'>Replying to {datum.reply?.sender === localStorage.getItem('uniqueUser') ? "Me" : datum.reply?.sender}</span>
          <p className='text-sm italic text-gray-400'>{datum.reply?.message}</p>
        </div>
        <span className='tracking-wide text-sm'>{datum.message}</span>
        <span className='mr-2 text-[12px] font-semibold bottom-0 text-right'>{datum.timestamp}</span>
      </div>
    );
  }
  return null;
};

const SwipeableChats: React.FC<SwipeableChatsProps> = ({ chat, setSelectedChat }) => (
  <>
    {chat.map((datum: Chat, key: number) => (
      <SwipeableChatItem key={key} datum={datum} setSelectedChat={setSelectedChat} />
    ))}
  </>
);

export default function Chat() {
  const [shadowText, setShadowText] = useState('');
  const [roomId, setRoomId] = useState<string>();
  const [notification, setNotification] = useState('');
  const [active, setActive] = useState('');
  const [messageData, setMessageData] = useState<Chat[]>([]);
  const [auth, setAuth] = useContext(UserData);
  const route = useRouter();
  const socket = io('wss://shadow-server-b7v0.onrender.com/');
  // const socket = io('ws://localhost:8000/');
  const chatScroll = useRef<any>(null);
  const [file, setFile] = useState<any>();
  const [prevMessages, setPrevMessages] = useState<Chat[]>([]);
  const [showEmojis, setShowEmojis] = useState(false);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  
  useEffect(() => {
    socketInitailization();
    const audio = new Audio('/sounds/mixkit-correct-answer-tone-2870.mp3');
    audio.play();
  }, []);

  useEffect(() => {
    const audio = new Audio('/sounds/mixkit-gaming-lock-2848.wav');
    socket.on('chat', (data: Chat) => {
      const id = localStorage.getItem('uniqueUser');
      var side: boolean;
      if(data.sender !== id){
        audio.play();
        side = false;
      }else{
        side = true;
      }
      setMessageData(prevData => [...prevData, {message: data.message, sender: data.sender, timestamp: data.timestamp, side: side, messageType: data.messageType, reply: data.reply }]);;
    });

   

    chatScroll.current.scrollTop = chatScroll.current.scrollHeight;
  }, [messageData]);

  // console.log(socket)

  useEffect(() => {
    setTimeout(() => {
      setNotification('')
    }, 5000) 
  }, [notification]);

  const socketInitailization = () => {
    const id: any = localStorage.getItem('shadowId');
    setRoomId(id);
    if(auth || id === 'general'){
      socket.emit('roomId', id);

      socket.on('joined', (data: any) => {
        setNotification(data);
      });

      socket.on('population', (data: any) => {
        setActive(data);
      });

      socket.on('prevMessages', (data:any) => {
        setPrevMessages(data);
        setMessageData(data);
        chatScroll.current.scrollTop = chatScroll.current.scrollHeight;
      })
    }else{
      route.push('/join');
    }
  }

  const handleSubmitText = (e: any) => {
      e.preventDefault();
      const messageType = selectedChat ? 'replyText' : 'text' ;
      const time = new Date();
      const hour = time.getHours();
      const min = time.getMinutes();
      const currentTime = hour + ":" + min;
      const id: any = localStorage.getItem('shadowId');
      const user: any = localStorage.getItem('uniqueUser');
      socket.emit('text', {message: shadowText, rooms: id, user: user, time: currentTime, messageType: messageType, reply: selectedChat ? { sender: selectedChat.sender, message: selectedChat.message } : null });
      setSelectedChat(null);
      setShadowText('');
  }

  // console.log(messageData)

  return (
    <section className='bg-black w-screen h-screen relative'>
        <div className='absolute top-0 w-full text-center z-50 bg-black'>
          <h1 className='py-3 text-center w-full text-gray-600 font-bold text-xl'>SHADOW</h1>
          <div className='text-gray-600'>
            {active}
          </div>
        </div>
        <div ref={chatScroll} className={`pt-24 h-[91dvh] ${selectedChat ? 'pb-24' : ''} overflow-y-scroll`}>
            <p className='text-gray-600 text-center'>{notification}</p>
           <div className='py-3'>
              {
                messageData.length > 0 && <SwipeableChats chat={messageData} setSelectedChat={setSelectedChat} /> 
              }
           </div>
        </div>
        {
                selectedChat &&
                <div className='w-full bg-black z-50 absolute bottom-20 px-5'>
                  <div className='w-fit bg-gray-900 rounded-xl p-3 pr-10 flex flex-col gap-3 relative'>
                    <span className='text-gray-500 text-xs'>Replying to {selectedChat.side ? "Me" : selectedChat.sender}</span>
                    <p className='text-gray-400 text-sm'>{selectedChat.message}</p>
                    <button onClick={() => setSelectedChat(null)} className='w-fit ml-auto text-sm text-gray-700 font-semibold absolute top-2 right-2'><FaTimes /></button>
                  </div>
                </div>
        }
        
        <div className=' w-full bg-black px-3 py-3 relative'>
              
            <form onSubmit={(e) => {
              e.preventDefault();
              if (shadowText) handleSubmitText(e);
            }}
            className='flex items-center justify-between'>
              <button onClick={(e:any ) => { e.preventDefault(); setShowEmojis(!showEmojis)}}>
                <BsEmojiSmile className='text-gray-500 text-2xl font-semibold cursor-pointer'/>
              </button>
               { showEmojis &&(
                    <div className='absolute bottom-20'>
                      <Picker
                      data={data}
                      dynamicWidth={false}
                      onClickOutside={() => setShowEmojis(false)}
                      onEmojiSelect={(emoji: any) => {setShadowText(shadowText + emoji.native)}}
                    />
                  </div>
                  )
                  }
              <input type="text" onChange={(e: any) => setShadowText(e.target.value)} value={shadowText} className='bg-black px-3 py-2 text-white focus:border-b-2  w-10/12 focus:outline-none' placeholder='Type here...'/>
              {
                shadowText && <button onClick={handleSubmitText} className='mx-5 '><BsFillSendFill className='text-2xl text-gray-500' /></button> 
              }
              
            </form>
        </div>
    </section>
  )
}

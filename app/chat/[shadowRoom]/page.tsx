'use client'
import React, { useContext, useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation';
import { io } from 'socket.io-client'
import { FaTimes } from "react-icons/fa";
import { BsFillSendFill } from "react-icons/bs";
import { UserData } from '@/app/context';
import { BsEmojiSmile } from "react-icons/bs";
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { useSwipeable } from 'react-swipeable';

const socket = io('wss://shadow-server-b7v0.onrender.com');
  // const socket = io('ws://localhost:8000/');

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

type Reactions = {
  reactions: string[],
  chatId: string,
  shadowId: string
}

function useLongPress(
  callback: () => void,
  ms: number = 500 // default: 0.5s
) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const start = useCallback(() => {
    timerRef.current = setTimeout(callback, ms);
  }, [callback, ms]);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return {
    onMouseDown: start,
    onTouchStart: start,
    onMouseUp: clear,
    onMouseLeave: clear,
    onTouchEnd: clear,
  };
}



const SwipeableChatItem: React.FC<{ datum: Chat, setSelectedChat: (chat: Chat) => void }> = ({ datum, setSelectedChat }) => {
  const [translateX, setTranslateX] = useState(0);
  const [quickReactionMenu, setQuickReactionMenu] = useState<string | undefined>(undefined);
  const [allReactions, setReactions] = useState<Reactions[]>([]);
  const [showEmojis, setShowEmojis] = useState(false);

  socket.on('prevReactions', (data: Reactions[]) => {
        setReactions(data);
    });

  const handleReaction = (emojiId: string) => {
    // e.preventDefault();
    socket.emit('reaction', { reaction: emojiId, chatId: datum._id, rooms: datum.shadowId });
    console.log({ reaction: emojiId, chatId: datum._id, rooms: datum.shadowId })
    // Here you can handle the reaction logic, e.g., send to server or update state

    setQuickReactionMenu(undefined); // Close the menu after selecting a reaction
  }

  const longPressHandlers = useLongPress(() => {
    setQuickReactionMenu(datum._id);
    setShowEmojis(true);
  }, 600); // 600ms hold

  const handlers = useSwipeable({
    onSwiping: (eventData) => {
      const move = Math.max(Math.min(eventData.deltaX, 60), -60);
      setTranslateX(move);
    },
    onSwiped: (eventData) => {
      // console.log(eventData)
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

  const getNativeEmoji = (emojiId: string) => {
    // emoji-mart v3+ stores all emojis in data as an object keyed by ID
    // @ts-ignore
    const emoji = (data as any).emojis?.[emojiId];
    if (!emoji) return '';
    return emoji.skins ? emoji.skins[0].native : emoji.native;
  }


  if (datum.messageType === 'text') {
    return (
      <p
        {...longPressHandlers}
        {...handlers}
        style={{
          transform: `translateX(${translateX}px)`,
          transition: translateX === 0 ? "transform 0.2s ease-out" : "none",
        }}
        className={`text-gray-400 relative mb-5 px-2 mx-2 w-fit max-w-[60%] py-2 bg-gray-800 flex min-w-[100px] flex-col-reverse gap-2 rounded-xl ${datum.side ? 'rounded-br-none ml-auto' : 'mr-auto rounded-bl-none'}`}>
        <span className='mr-2 sm:text-[10px] text-[12px] font-semibold bottom-0 text-right'>{datum.timestamp}</span>
        <span className='tracking-wide sm:text-xs text-sm'>{datum.message}</span>
        <span className='text-sm sm:text-xs font-semibold text-gray-500'>{datum.side ? "Me" : datum.sender}</span>
        <div className='absolute max-w-[150px] overflow-x-scroll -bottom-4 backdrop-blur-xl rounded-full gap-1 left-0 flex z-50 '>
          {allReactions
            .filter(reaction => reaction.chatId === datum._id)
            .flatMap(reaction => {
              // Count occurrences of each emojiId
              const counts: { [emojiId: string]: number } = {};
              reaction.reactions.forEach(emojiId => {
                counts[emojiId] = (counts[emojiId] || 0) + 1;
              });
              // Render each unique emojiId with its count
              return Object.entries(counts).map(([emojiId, count], idx) => (
                <div className='px-1 py-1 flex items-center rounded-full bg-gray-900' key={idx}>
                  <span className='text-xs rounded-full'>{getNativeEmoji(emojiId)}</span>
                  {count > 1 && (
                    <span className='ml-1 text-[10px] text-gray-400 font-bold'>{count}</span>
                  )}
                </div>
              ));
            })}
        </div>
        {
          // Quick Reaction Menu emojis (the Picker can be used here too if you want more emojis)
          quickReactionMenu === datum._id && showEmojis && (
            <div className={`absolute bottom-2 w-fit backdrop-blur-xl rounded-xl p-3 pr-10 flex flex-col gap-3 z-50 ${datum.side ? 'hidden' : 'left-0'}`}>
              <span className='text-gray-500 text-xs'>Quick Reactions</span>
              <Picker 
                  reactionsDefaultOpen={true} 
                  perLine={5}
                  emojiSize={15}
                  onClickOutside={() => {setQuickReactionMenu(undefined); setShowEmojis(false);}}
                  data={data}
                  previewPosition={'none'}
                  onEmojiSelect={(emoji: any) => handleReaction(emoji.id)} 
                />
              <button onClick={() => setShowEmojis(false)} className='w-fit ml-auto text-sm text-gray-700 font-semibold absolute top-2 right-2'><FaTimes /></button>
            </div>
          )
        }
      </p>
    );
  } else if (datum.messageType === 'replyText') {
    return (
      <div
        {...longPressHandlers}
        {...handlers}
        style={{
          transform: `translateX(${translateX}px)`,
          transition: translateX === 0 ? "transform 0.2s ease-out" : "none",
        }}
        className={`text-gray-400 mb-5 px-2 mx-2 w-fit max-w-[60%] py-2 bg-gray-800 flex flex-col gap-2 rounded-xl ${datum.side ? 'rounded-br-none ml-auto' : 'mr-auto rounded-bl-none'}`}>
        <span className='text-sm font-semibold text-gray-500'>{datum.side ? "Me" : datum.sender}</span>
        <div className='pl-2 border-l-2 border-gray-600'>
          <span className='text-sm text-gray-500'>Replying to {datum.reply?.sender === localStorage.getItem('uniqueUser') ? "Me" : datum.reply?.sender}</span>
          <p className='text-sm italic text-gray-400'>{datum.reply?.message}</p>
        </div>
        <span className='tracking-wide text-sm'>{datum.message}</span>
        <span className='mr-2 text-[12px] font-semibold bottom-0 text-right'>{datum.timestamp}</span>
        <div className='absolute max-w-[150px] overflow-x-scroll -bottom-4 rounded-full backdrop-blur-xl gap-1 left-0 flex z-50 '>
          {allReactions
            .filter(reaction => reaction.chatId === datum._id)
            .flatMap(reaction => {
              // Count occurrences of each emojiId
              const counts: { [emojiId: string]: number } = {};
              reaction.reactions.forEach(emojiId => {
                counts[emojiId] = (counts[emojiId] || 0) + 1;
              });
              // Render each unique emojiId with its count
              return Object.entries(counts).map(([emojiId, count], idx) => (
                <div className='px-1 py-1 flex items-center rounded-full bg-gray-900' key={idx}>
                  <span className='text-xs rounded-full'>{getNativeEmoji(emojiId)}</span>
                  {count > 1 && (
                    <span className='ml-1 text-[10px] text-gray-400 font-bold'>{count}</span>
                  )}
                </div>
              ));
            })}
        </div>
        {
          // Quick Reaction Menu emojis (the Picker can be used here too if you want more emojis)
          quickReactionMenu === datum._id && (
            <div className='absolute bottom-2 w-fit backdrop-blur-xl rounded-xl p-3 pr-10 flex flex-col gap-3 z-50'>
              <span className='text-gray-500 text-xs'>Quick Reactions</span>
              {

              }
              <Picker 
                  reactionsDefaultOpen={true} 
                  // dynamicWidth={true}
                  perLine={5}
                  emojiSize={15}
                  onClickOutside={() => setQuickReactionMenu(undefined)}
                  data={data}
                  previewPosition={'none'}
                  onEmojiSelect={(emoji: any) => handleReaction(emoji.id)} 
                />
              <button onClick={() => setQuickReactionMenu(undefined)} className='w-fit ml-auto text-sm text-gray-700 font-semibold absolute top-2 right-2'><FaTimes /></button>
            </div>
          )
        }
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
  const chatScroll = useRef<any>(null);
  const [file, setFile] = useState<any>();
  const [prevMessages, setPrevMessages] = useState<Chat[]>([]);
  const [showEmojis, setShowEmojis] = useState(false);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [reactions, setReactions] = useState<Reactions[]>([]);
  
  useEffect(() => {
    socketInitailization();
    const audio = new Audio('/sounds/mixkit-correct-answer-tone-2870.mp3');
    audio.play();

    // Cleanup on unmount
    return () => {
      socket.off('chat');
      socket.off('joined');
      socket.off('population');
      socket.off('prevMessages');
      socket.off('prevReactions');
    };
  }, []);

  // console.log(socket)

  useEffect(() => {
    setTimeout(() => {
      setNotification('')
    }, 5000) 
  }, [notification]);

  useEffect(() => {
     if (chatScroll.current) {
      chatScroll.current.scrollTop = chatScroll.current.scrollHeight;
    }
  }, [messageData]);

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

      socket.on('prevReactions', (data:any) => {
        setReactions(data);
      });

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
    <section className='bg-black sm:w-[30vw] h- mx-auto relative'>
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
              
            <form
            className='flex items-center justify-between'>
              <button onClick={(e:any ) => { e.preventDefault(); setShowEmojis(!showEmojis)}}>
                <BsEmojiSmile className='text-gray-500 text-2xl font-semibold cursor-pointer'/>
              </button>
               { showEmojis && (
                    <div className='absolute bottom-20'>
                      <Picker
                        data={data}
                        dynamicWidth={false}
                        previewPosition='none'
                        perLine={7}
                        emojiSize={20}
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

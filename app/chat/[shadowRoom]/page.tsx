'use client'
import React, { useContext, useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation';
import { io } from 'socket.io-client'
import { FaTimes, FaTrash } from "react-icons/fa";
import { BsFillSendFill } from "react-icons/bs";
import { UserData } from '@/app/context';
import { BsEmojiSmile } from "react-icons/bs";
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { useSwipeable } from 'react-swipeable';
import { AnimatePresence, motion } from "framer-motion";

const socket = io('wss://shadow-server-b7v0.onrender.com');

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
  reactions: Reactions[];
  setReactionTarget: (id: string | null) => void;
  setShowQuickReactions: (b: boolean) => void;
};

type Reaction = {
  reaction: string,
  reactor: string
}

type Reactions = {
  reactions: Reaction[],
  chatId: string,
  shadowId: string
}

function useLongPress(
  callback: () => void,
  ms: number = 500
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

const SwipeableChatItem: React.FC<{
  datum: Chat,
  setSelectedChat: (chat: Chat) => void,
  reactions: Reactions[],
  setReactionTarget: (id: string | null) => void,
  setShowQuickReactions: (b: boolean) => void
}> = ({ datum, setSelectedChat, reactions, setReactionTarget, setShowQuickReactions }) => {
  const [translateX, setTranslateX] = useState(0);
  const [showDelete, setShowDelete] = useState(false);
  const [replySnap, setReplySnap] = useState(false);

  const handlers = useSwipeable({
    onSwiping: (eventData) => {
      if (eventData.dir === "Right") {
        const move = Math.max(Math.min(eventData.deltaX, 80), 0); // only allow positive right drag
        setTranslateX(move);
      }
    },
    onSwiped: (eventData) => {
      if (eventData.dir === "Right" && eventData.deltaX > 50) {
        // trigger reply
        setReplySnap(true); 
        setTimeout(() => {
          setSelectedChat(datum);
          setReplySnap(false);
          setTranslateX(0);
        }, 200); // snap animation duration
      } else {
        setTranslateX(0);
      }
    },
    preventScrollOnSwipe: true,
    trackMouse: true,
  });

  const me: boolean = datum.sender === localStorage.getItem('uniqueUser');

  const longPressHandlers = useLongPress(() => {
    if (me) {
      setShowDelete(true);
    } else {
      setReactionTarget(datum._id || null);
      setShowQuickReactions(true);
    }
  }, 600);

  const getNativeEmoji = (emojiId: string) => {
    // @ts-ignore
    const emoji = (data as any).emojis?.[emojiId];
    if (!emoji) return '';
    return emoji.skins ? emoji.skins[0].native : emoji.native;
  };

  const handleDelete = () => {
    socket.emit('deleteChat', { chatId: datum._id, rooms: datum.shadowId });
  };

  const reactionsForMessage = reactions
    .filter(r => r.chatId === datum._id)
    .flatMap(r => {
      const counts: { [emojiId: string]: number } = {};
      r.reactions.forEach(emojiId => {
        counts[emojiId.reaction] = (counts[emojiId.reaction] || 0) + 1;
      });
      return Object.entries(counts).map(([emojiId, count], idx) => (
        <div key={idx} className='px-1 py-1 flex items-center rounded-full bg-gray-900'>
          <span className='text-sm rounded-full'>{getNativeEmoji(emojiId)}</span>
          {count > 1 && (
            <span className='ml-1 text-[10px] text-gray-400 font-bold'>{count}</span>
          )}
        </div>
      ));
    });

  return (
    <motion.div
      {...longPressHandlers}
      {...handlers}
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: 1,
        y: 0,
        x: replySnap ? 40 : translateX
      }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      exit={{ opacity: 0, y: 20 }}
      className={`text-gray-400 relative mb-5 px-2 mx-2 w-fit max-w-[60%] py-2 bg-gray-800 flex ${
        datum.messageType==="text" ? "flex-col-reverse" : "flex-col"
      } gap-2 rounded-xl ${datum.side ? 'rounded-br-none ml-auto' : 'mr-auto rounded-bl-none'}`}
    >

      <span className='text-sm sm:text-xs font-semibold text-gray-500'>
        {datum.side ? "Me" : datum.sender}
      </span>

      { datum.messageType==="replyText" && (
        <div className='pl-2 border-l-2 border-gray-600'>
          <span className='text-sm text-gray-500'>
            Replying to {datum.reply?.sender === localStorage.getItem('uniqueUser') ? "Me" : datum.reply?.sender}
          </span>
          <p className='sm:text-xs text-sm italic text-gray-400'>{datum.reply?.message}</p>
        </div>
      )}

      <span className='tracking-wide sm:text-xs text-sm'>{datum.message}</span>
      <span className='mr-2 sm:text-[10px] text-[12px] font-semibold bottom-0 text-right'>{datum.timestamp}</span>

      {/* Reactions */}
      <div className='absolute max-w-[150px] overflow-x-scroll -bottom-4 backdrop-blur-xl rounded-full gap-1 left-0 flex z-20'>
        {reactionsForMessage}
      </div>

      {/* Delete button for sender only */}
      { showDelete && me && 
        <motion.div  
          initial={{opacity:0, x:-20}} 
          animate={{opacity:1, x:0}} 
          exit={{opacity:0, x:-20}}
          className='absolute top-2 -left-[120px] z-50 backdrop-blur-xl p-2 rounded flex items-center gap-1 text-sm'
        >
          <button onClick={() => setShowDelete(false)} className='text-sm text-red-500 hover:text-red-600 bg-red-400 rounded-full p-1'><FaTimes /></button>
          <button onClick={handleDelete} className='flex items-center gap-1 '><FaTrash className='text-red-500'/> Delete</button> 
        </motion.div>
      }
    </motion.div>
  );
};


const SwipeableChats: React.FC<SwipeableChatsProps> = ({ chat, setSelectedChat, reactions, setReactionTarget, setShowQuickReactions }) => (
  <>
    {chat.map((datum: Chat, key: number) => (
      <SwipeableChatItem 
        key={datum._id || key} 
        datum={datum} 
        setSelectedChat={setSelectedChat} 
        reactions={reactions} 
        setReactionTarget={setReactionTarget} 
        setShowQuickReactions={setShowQuickReactions} 
      />
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
  const [showEmojis, setShowEmojis] = useState(false); // input picker
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [reactions, setReactions] = useState<Reactions[]>([]);

  // New states for global quick reactions
  const [reactionTarget, setReactionTarget] = useState<string | null>(null);
  const [showQuickReactions, setShowQuickReactions] = useState(false);

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
        setMessageData(prevData => [...prevData, {message: data.message, sender: data.sender, timestamp: data.timestamp, side: side, messageType: data.messageType, reply: data.reply, _id: data._id, shadowId: data.shadowId }]);;
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

  const handleTextChange = (e: any) => {
    setShadowText(e.target.value);
    // emit typing event
    socket.emit('typing', {rooms: roomId});
  }

  useEffect(() => {
    socket.on('typing', (data: any) => {
      setNotification(data);
    });
  }, [roomId]);

  // Global reaction handler (called by global picker)
  const handleGlobalReaction = (emoji: any) => {
    if (!reactionTarget) return;
    const targetMessage = messageData.find(m => m._id === reactionTarget);
    const reactionObj = {
      reaction: {
        reaction: emoji.id, 
        reactor: localStorage.getItem('uniqueUser')
      },
      chatId: reactionTarget,
      rooms: targetMessage?.shadowId || roomId,
    };
    socket.emit('reaction', reactionObj);
    setReactionTarget(null);
    setShowQuickReactions(false);
  }

  return (
    <section className='bg-black sm:w-[30vw] h- mx-auto relative'>
        <div className='absolute top-0 w-full text-center z-50 bg-black'>
          <h1 className='py-3 text-center w-full text-gray-600 font-bold text-xl'>SHADOW</h1>
          <div className='text-gray-600'>
            {active}
          </div>
          <p className='text-gray-600 text-center w-full'><i>{notification}</i></p>
        </div>
        <div ref={chatScroll} className={`pt-24 h-[91dvh] ${selectedChat ? 'pb-24' : ''} overflow-y-scroll`}>
            
           <div className='py-3'>
              {
                messageData.length > 0 && <SwipeableChats chat={messageData} reactions={reactions} setSelectedChat={setSelectedChat} setReactionTarget={setReactionTarget} setShowQuickReactions={setShowQuickReactions} /> 
              }
           </div>
        </div>

        {/* Global Quick Reaction Picker (outside chat bubble, above everything) */}
        { showQuickReactions && reactionTarget && (
          <div className='fixed bottom-24 left-1/2 -translate-x-1/2 w-fit backdrop-blur-xl rounded-xl p-3 pr-10 flex flex-col gap-3 z-[9999]'>
            <span className='text-gray-500 text-xs'>Quick Reactions</span>
            <Picker 
                reactionsDefaultOpen={true} 
                perLine={5}
                emojiSize={15}
                onClickOutside={() => { setReactionTarget(null); setShowQuickReactions(false); }}
                data={data}
                previewPosition={'none'}
                onEmojiSelect={(emoji: any) => handleGlobalReaction(emoji)} 
              />
            <button onClick={() => { setReactionTarget(null); setShowQuickReactions(false); }} className='w-fit ml-auto text-sm text-gray-700 font-semibold absolute top-2 right-2'><FaTimes /></button>
          </div>
        ) }

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
                    <div className='absolute bottom-20 z-40'>
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
              <input type="text" onChange={(e: any) => handleTextChange(e)} value={shadowText} className='bg-black px-3 py-2 text-white focus:border-b-2  w-10/12 focus:outline-none' placeholder='Type here...'/>
              {
                shadowText && <button onClick={handleSubmitText} className='mx-5 '><BsFillSendFill className='text-2xl text-gray-500' /></button> 
              }
              
            </form>
        </div>
    </section>
  )
}

import { useCallback, useRef, useState } from "react"
import { useSwipeable } from "react-swipeable"
import { AnimatePresence, motion } from "framer-motion";
import { FaTimes, FaTimesCircle, FaTrash } from "react-icons/fa";


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
  socket: any
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
  socket: any
}> = ({ datum, setSelectedChat, reactions, setReactionTarget, setShowQuickReactions, socket }) => {
  const me: boolean = datum.sender === localStorage.getItem('uniqueUser');
  const [translateX, setTranslateX] = useState(0);
  const [showDelete, setShowDelete] = useState(false);
  const [replySnap, setReplySnap] = useState(false);
  const [showAllReactions, setShowAllReactions] = useState(false);
  const message = {
    ...datum,
    side: me
  }

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
          setSelectedChat(message);
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


  const longPressHandlers = useLongPress(() => {
    if (me) {
      setShowDelete(true);
    } else {
      setReactionTarget(message._id || null);
      setShowQuickReactions(true);
    }
  }, 600);

  const getNativeEmoji = (emojiId: string) => {
    // @ts-ignore
    const emoji = (data as any).emojis?.[emojiId];
    if (!emoji) return '';
    return emoji.skins ? emoji.skins[0].native : emoji.native;
  };

  const handleDelete = (e: React.FormEvent<HTMLInputElement>) => {
    e.preventDefault();
    socket.emit('deleteChat', { chatId: message._id, rooms: message.shadowId });

  };

  const reactionsForMessage = reactions
    .filter(r => r.chatId === message._id)
    .flatMap(r => {
      const counts: { [emojiId: string]: number } = {};
      r.reactions.forEach(emojiId => {
        counts[emojiId.reaction] = (counts[emojiId.reaction] || 0) + 1;
      });
      return Object.entries(counts).map(([emojiId, count], idx) => (
        <div key={idx} className={`flex items-center rounded-full bg-gray-900 justify-center ${showAllReactions ? "border border-gray-800 px-3 py-2 rounded" : "px-1 py-1 "} `}>
          <span className='text-sm rounded-full'>{getNativeEmoji(emojiId)}</span>
          {count > 1 && (
            <span className='ml-1 text-[10px] text-gray-400 font-extrabold'>{count}</span>
          )}
        </div>
      ));
    });

  // Utility to check if a string is only emojis
 const isEmojiOnly = (text: string) => {
  if (!text) return false;

  // Remove all whitespace
  const trimmed = text.replace(/\s/g, "");

  // Regex to match most common emojis (including smileys, symbols, flags, gestures, etc.)
  const emojiRegex =
    /^(?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F)+$/u;

  return emojiRegex.test(trimmed);
};


  return (
    <motion.div
      {...longPressHandlers}
      {...handlers}
      initial={{ opacity: 0, y: 16 }}
      animate={{
        opacity: 1,
        y: 0,
        x: replySnap ? 40 : translateX,
      }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      exit={{ opacity: 0, y: 16 }}
      className={`
        relative mb-5 px-3 py-2 max-w-[65%] min-w-[30%]
        flex flex-col gap-1
        text-sm leading-relaxed shadow-sm
        select-none chat-bubble
        ${message.side
          ? "ml-auto bg-[#202c33] text-white rounded-2xl rounded-br-md"
          : "mr-auto bg-[#202c33] text-gray-100 rounded-2xl rounded-bl-md"}
      `}
    >
      {/* Sender */}
      <span className="text-[11px] font-medium text-gray-400">
        {message.side ? "Me" : message.sender}
      </span>

      {/* Reply block */}
      {message.messageType === "replyText" && (
        <div className="pl-2 pr-1 py-1 border-l-2 border-gray-500 bg-black/10 rounded-sm">
          <span className="text-[11px] text-gray-400">
            Replying to{" "}
            {message.reply?.sender === localStorage.getItem("uniqueUser")
              ? "Me"
              : message.reply?.sender}
          </span>
          <p className="text-[12px] italic text-gray-300 line-clamp-2">
            {message.reply?.message}
          </p>
        </div>
      )}

      {/* Message */}
      <span
        className={`tracking-wide ${isEmojiOnly(message.message)
            ? "text-3xl sm:text-4xl" // bigger for emoji-only messages
            : "text-[14px] sm:text-[13px]" // normal text
          }`}
      >
        {message.message}
      </span>
      {/* Timestamp */}
      <span className="self-end text-[10px] text-gray-400 mt-1">
        {message.timestamp}
      </span>

      {/* REACTIONS */}
      {reactionsForMessage.length > 0 && (
        <div className="absolute -bottom-4 left-2 z-30">
          {/* COLLAPSED */}
          {!showAllReactions && (
            <div
              onClick={() =>
                reactionsForMessage.length > 5 &&
                setShowAllReactions(true)
              }
              className="
                flex items-center gap-1
                px-1 py-[2px]
                bg-[#111b21]
                rounded-full shadow-md
                cursor-pointer
                w-fit
                overflow-hidden
              "
            >
              {reactionsForMessage.slice(0, 5)}

              {reactionsForMessage.length > 5 && (
                <span className="text-[11px] text-gray-400 font-semibold px-1">
                  +{reactionsForMessage.length - 5}
                </span>
              )}
            </div>
          )}

          {/* EXPANDED */}
          {showAllReactions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="
                absolute left-0 -top-8 z-50
                bg-[#111b21]
                rounded-xl shadow-xl
                px-5 py-5
                w-[350px] 
                max-h-[500px]
                overflow-y-auto
                flex flex-wrap gap-3
                scrollbar-thin scrollbar-thumb-gray-700
                select-none
              "
            >


              {reactionsForMessage}


              <button
                onClick={() => setShowAllReactions(false)}
                className="
                          absolute top-2 right-2
                          w-4 h-4
                          flex items-center justify-center
                          text-gray-400 hover:text-white
                        "
              >
                <FaTimesCircle size={20} />
              </button>
            </motion.div>
          )}
        </div>
      )}

      {/* DELETE MENU */}
      {showDelete && me && (
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          className="
            absolute top-2 -left-[110px]
            bg-[#111b21] text-gray-200
            rounded-lg shadow-lg
            px-3 py-2 text-sm
            flex items-center gap-3
            z-50
          "
        >
          <button
            onClick={() => setShowDelete(false)}
            className="text-gray-400 hover:text-white"
          >
            <FaTimes />
          </button>

          <button
            onClick={(e: any) => handleDelete(e)}
            className="flex items-center gap-1 text-red-400 hover:text-red-500"
          >
            <FaTrash /> Delete
          </button>
        </motion.div>
      )}
    </motion.div>
  );
};


const SwipeableChats: React.FC<SwipeableChatsProps> = ({ chat, setSelectedChat, reactions, setReactionTarget, setShowQuickReactions, socket }) => (
  <>
    {chat.map((datum: Chat, key: number) => (
      <SwipeableChatItem
        key={datum._id || key}
        datum={datum}
        socket={socket}
        setSelectedChat={setSelectedChat}
        reactions={reactions}
        setReactionTarget={setReactionTarget}
        setShowQuickReactions={setShowQuickReactions}
      />
    ))}
  </>
);

export default SwipeableChats;
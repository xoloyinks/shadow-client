'use client'
import Image from 'next/image';
import React, { useContext, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation';
import { AudioRecorder, useAudioRecorder } from 'react-audio-voice-recorder';
import { io } from 'socket.io-client'
import { FaStop } from "react-icons/fa";
import { FaPause } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { FaPlay } from "react-icons/fa";
import { BsFillSendFill } from "react-icons/bs";
import { UserData } from '@/app/context';
import { LuGalleryVerticalEnd } from "react-icons/lu";
import { BsEmojiSmile } from "react-icons/bs";
import { HiMicrophone } from "react-icons/hi2";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import axios from 'axios';
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'


type Chat = {
  message: string,
  time: string, 
  user: string,
  side: boolean,
  messageType: string
}

type CaptionData = {
  avatar: string,
  caption: string
}


export default function Chat() {
  const [shadowText, setShadowText] = useState('');
  const [roomId, setRoomId] = useState<string>();
  const [notification, setNotification] = useState('');
  const [active, setActive] = useState('');
  const [messageData, setMessageData] = useState<Chat[]>([]);
  const [auth, setAuth] = useContext(UserData);
  const route = useRouter();
  const socket = io('wss://shadow-server-b7v0.onrender.com');
  const chatScroll = useRef<any>(null);
  const [file, setFile] = useState<any>();
  const [imageCaption, setImageCaption] = useState('');
  const [captionData, setCaptionData] = useState<CaptionData[]>([]);
  const [prevMessages, setPrevMessages] = useState([]);
  const [prevImageCaption, setPrevImageCaption] = useState([]);
  const [showEmojis, setShowEmojis] = useState(false);
  
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
      if(data.user !== id){
        audio.play();
        side = false;
      }else{
        side = true;
      }
      setMessageData(prevData => [...prevData, {message: data.message, user: data.user, time: data.time, side: side, messageType: data.messageType }]);
    });

    socket.on('imageData', ({image, caption}: {image:string, caption: string}) => {
      setCaptionData(prevData => [...prevData, {avatar: image, caption: caption }]);
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
    if(auth){
      socket.emit('roomId', id);

      socket.on('joined', (data: any) => {
        setNotification(data);
      });

      socket.on('population', (data: any) => {
        setActive(data);
      });

      socket.on('prevMessages', (data:any) => {
        setPrevMessages(data);
        chatScroll.current.scrollTop = chatScroll.current.scrollHeight;
      })

      socket.on('prevImageCaptions', (data: any) => {
        setPrevImageCaption(data);
      })
    }else{
      route.push('/join');
    }
  }

  const handleSubmitText = (e: any) => {
      e.preventDefault();
      const messageType = 'text';
      const time = new Date();
      const hour = time.getHours();
      const min = time.getMinutes();
      const currentTime = hour + ":" + min;
      const id: any = localStorage.getItem('shadowId');
      const user: any = localStorage.getItem('uniqueUser');
      socket.emit('text', {message: shadowText, rooms: id, user: user, time: currentTime, messageType: messageType});
      setShadowText('');
  }

  const onFileChange = (e: any) => {
      setFile(e.target.files[0]);
  }

  const handleImage = async(e: any) => {
      e.preventDefault();
      const time = new Date();
      const hour = time.getHours();
      const min = time.getMinutes();
      const currentTime = hour + ":" + min;
      const id: any = localStorage.getItem('shadowId');
      const user: any = localStorage.getItem('uniqueUser');
      const formData = new FormData();
      formData.append('file', file);
      const upload = axios.post('https://shadow-server-b7v0.onrender.com/uploadedImage', formData, {
        headers: {
          "Content-Type": 'multipart/form-data'
        }
      });
        const messageType = "image";
        const file_name: any = await upload.then(res => res.data);
        socket.emit('image', {message: file_name, rooms: id, user: user, time: currentTime, messageType: messageType});
  } 

  const handleImageCaption = async(e: any) => {
    e.preventDefault();
    const time = new Date();
    const hour = time.getHours();
    const min = time.getMinutes();
    const currentTime = hour + ":" + min;
    const id: any = localStorage.getItem('shadowId');
    const user: any = localStorage.getItem('uniqueUser');
    const formData = new FormData();
    formData.append('file', file);
    const upload = axios.post('https://shadow-server-b7v0.onrender.com/uploadedImage', formData, {
      headers: {
        "Content-Type": 'multipart/form-data'
      }
    });
    const messageType = "image_caption";
    const file_name: any = await upload.then(res => res.data);
    socket.emit('image', {message: file_name, rooms: id, user: user, time: currentTime, messageType: messageType});
    socket.emit('image_caption', {image: file_name, caption: imageCaption, rooms: id});
} 

  

  const recorderControls = useAudioRecorder()
  // const addAudioElement = (blob: any) => {
  //   const url = URL.createObjectURL(blob);
  //   const audio = document.createElement("audio");
  //   audio.src = url;
  //   audio.controls = true;
  //   document.body.appendChild(audio);
  // };
  // console.log("Record blob: " + recorderControls.recordingBlob)

  return (
    <section className='bg-black w-screen h-screen relative'>
        <div className='absolute top-0 w-full text-center z-50 bg-black'>
          <h1 className='py-3 text-center w-full text-gray-600 font-bold text-xl'>SHADOW</h1>
          <div className='text-gray-600'>
            {active}
          </div>
        </div>
        <div ref={chatScroll} className='pt-24 h-[91vh] overflow-y-scroll'>
            <p className='text-gray-600 text-center'>{notification}</p>
           <div className='py-3'>
           {
              prevMessages.map((datum: any, key: number) => (
                datum.messageType === 'text' ? 
                <p key={key} className={`text-gray-400 mb-2 px-2 mx-2 w-fit max-w-[60%] py-2 bg-gray-800 flex min-w-[100px] flex-col-reverse gap-2 rounded-xl ${datum.side ? 'ml-auto' : 'mr-auto'}`}>
                  <span className='mr-2 text-[12px] font-semibold bottom-0 text-right'>{datum.timestamp}</span>
                  <span className='tracking-wide text-sm'>{datum.message}</span>
                  <span className='text-sm font-semibold text-gray-500'>{datum.side ? "Me" : datum.sender}</span>
                </p> : 
                datum.messageType === 'image' ?
                <p key={key} className={`w-fit p-2 bg-gray-800 rounded-xl ${datum.side ? 'ml-auto' : 'mr-auto'} text-gray-400 mx-2 mb-2 relative flex flex-col` }>
                   <span className={`text-sm font-semibold text-gray-500 ${datum.side ? " float-end" : 'float-start'}`}>
                    {datum.side ? "Me" : datum.sender}
                  </span>
                   <span className='rounded-xl mb-2 w-fit'>
                      <Dialog>
                        <DialogTrigger><Image alt='Image' width={300} height={300} key={key} src={`https://shadow-server-b7v0.onrender.com/images/${datum.message}`} className='roundex-xl py-3' /></DialogTrigger>
                        <DialogContent>
                          <Image alt='Image' width={700} height={700} key={key} src={`https://shadow-server-b7v0.onrender.com/images/${datum.message}`} className='roundex-xl py-3' />
                        </DialogContent>
                      </Dialog>
                   </span>
                   <span className={`mr-2 text-[12px] font-semibold bottom-2 text-right absolute right-2`}>{datum.timestamp}</span>
                </p> :
                // Image with captions
                 datum.messageType === 'image_caption' ?
                 <p key={key} className={`w-fit p-2 bg-gray-800 rounded-xl ${datum.side ? 'ml-auto' : 'mr-auto'} text-gray-400 mx-2 mb-2 relative flex flex-col sm:max-w-[300px] max-w-[80%]` }>
                    <span className={`text-sm font-semibold text-gray-500 ${datum.side ? " float-end" : 'float-start'}`}>
                     {datum.side ? "Me" : datum.sender}
                   </span>
                    <span className='rounded-xl mb-2 w-fit'>
                       <Dialog>
                         <DialogTrigger><Image alt='Image' width={300} height={300} key={key} src={`https://shadow-server-b7v0.onrender.com/images/${datum.message}`} className='roundex-xl w-full' /></DialogTrigger>
                         <DialogContent>
                           <Image alt='Image' width={700} height={700} key={key} src={`https://shadow-server-b7v0.onrender.com/images/${datum.message}`} className='roundex-xl ' />
                           <DialogFooter className='text-gray-400 text-center text-sm'>
                             {prevImageCaption.map((data: any, key: any) => (
                                data.image === datum.message ? `${data.caption}` : null
                             ))}
                           </DialogFooter>
                         </DialogContent>
                       </Dialog>
                    </span>
                    <span className='text-sm my-2 w-[80%]'>
                      {prevImageCaption.map((data: any, key: any) => (
                          data.image === datum.message ? `${data.caption}` : null
                      ))}
                    </span>
                    <span className={`mr-2 text-[12px] font-semibold bottom-2 text-right absolute right-2`}>{datum.timestamp}</span>
                 </p> :
                 "Null"

              )
              )
            }
            {
              messageData.map((datum: Chat, key: number) => (
                datum.messageType === 'text' ? 
                <p key={key} className={`text-gray-400 mb-2 px-2 mx-2 w-fit max-w-[60%] py-2 bg-gray-800 flex min-w-[100px] flex-col-reverse gap-2 rounded-xl ${datum.side ? 'ml-auto' : 'mr-auto'}`}>
                  <span className='mr-2 text-[12px] font-semibold bottom-0 text-right'>{datum.time}</span>
                  <span className='tracking-wide text-sm'>{datum.message}</span>
                  <span className='text-sm font-semibold text-gray-500'>{datum.side ? "Me" : datum.user}</span>
                </p> : 
                datum.messageType === 'image' ?
                <p key={key} className={`w-fit p-2 bg-gray-800 rounded-xl ${datum.side ? 'ml-auto' : 'mr-auto'} text-gray-400 mx-2 mb-2 relative flex flex-col` }>
                   <span className={`text-sm font-semibold text-gray-500 ${datum.side ? " float-end" : 'float-start'}`}>
                    {datum.side ? "Me" : datum.user}
                  </span>
                   <span className='rounded-xl mb-2 w-fit'>
                      <Dialog>
                        <DialogTrigger><Image alt='Image' width={300} height={300} key={key} src={`https://shadow-server-b7v0.onrender.com/images/${datum.message}`} className='roundex-xl py-3' /></DialogTrigger>
                        <DialogContent>
                          <Image alt='Image' width={700} height={700} key={key} src={`https://shadow-server-b7v0.onrender.com/images/${datum.message}`} className='roundex-xl py-3' />
                        </DialogContent>
                      </Dialog>
                   </span>
                   <span className={`mr-2 text-[12px] font-semibold bottom-2 text-right absolute right-2`}>{datum.time}</span>
                </p> :
                // Image with captions
                 datum.messageType === 'image_caption' ?
                 <p key={key} className={`w-fit p-2 bg-gray-800 rounded-xl ${datum.side ? 'ml-auto' : 'mr-auto'} text-gray-400 mx-2 mb-2 relative flex flex-col sm:max-w-[300px] max-w-[80%]` }>
                    <span className={`text-sm font-semibold text-gray-500 ${datum.side ? " float-end" : 'float-start'}`}>
                     {datum.side ? "Me" : datum.user}
                   </span>
                    <span className='rounded-xl mb-2 w-fit'>
                       <Dialog>
                         <DialogTrigger><Image alt='Image' width={300} height={300} key={key} src={`https://shadow-server-b7v0.onrender.com/images/${datum.message}`} className='roundex-xl w-full' /></DialogTrigger>
                         <DialogContent>
                           <Image alt='Image' width={700} height={700} key={key} src={`https://shadow-server-b7v0.onrender.com/images/${datum.message}`} className='roundex-xl ' />
                           <DialogFooter className='text-gray-400 text-center text-sm'>
                             {captionData.map((data: CaptionData, key: any) => (
                                data.avatar === datum.message ? `${data.caption}` : null
                             ))}
                           </DialogFooter>
                         </DialogContent>
                       </Dialog>
                    </span>
                    <span className='text-sm my-2 w-[80%]'>
                      {captionData.map((data: CaptionData, key: any) => (
                          data.avatar === datum.message ? `${data.caption}` : null
                      ))}
                    </span>
                    <span className={`mr-2 text-[12px] font-semibold bottom-2 text-right absolute right-2`}>{datum.time}</span>
                 </p> :
                 "Null"

              )
              )
            }
           </div>
        </div>
        <div className='absolute bottom-0 w-full bg-black px-3 py-3  '>
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
                shadowText ? <button onClick={handleSubmitText} className='mx-5 '><BsFillSendFill className='text-2xl text-gray-500' /></button>  : 
                <div className='mx-5 flex gap-5'>
                    <span className='hidden'>
                      <AudioRecorder 
                        // onRecordingComplete={(blob) => addAudioElement(blob)}
                        recorderControls={recorderControls}
                        showVisualizer={true}
                      />
                    </span>
                  {/* Record */}
                  {/* <Popover>
                    <PopoverTrigger><HiMicrophone  className='text-2xl text-gray-500' /></PopoverTrigger>
                    <PopoverContent className='relative'>
                        {
                          recorderControls.isRecording ? 
                          // Pause, Play, Stop, Delete
                          <div className='mx-auto flex gap-5 relative'> 
                            <button onClick={recorderControls.stopRecording}  className='py-2 rounded-md text-2xl text-red-500 animate-pulse'><FaStop /></button> 
                            {
                              recorderControls.isPaused ? 
                              <button onClick={recorderControls.togglePauseResume}  className='py-2 rounded-md text-2xl text-white'>
                                <FaPlay />
                              </button> : 
                              <button onClick={recorderControls.togglePauseResume}  className='py-2 rounded-md text-2xl text-white'>
                                <FaPause />
                              </button>
                            }
                            <button onClick={recorderControls.stopRecording}  className='py-2 rounded-md text-2xl text-white'><MdDelete /></button>

                            <div className='text-white absolute right-5 bottom-2'>{recorderControls.recordingTime}secs</div>
                          </div>  : 

                          // Start recording
                          <div className='mx-auto'> 
                            <button onClick={recorderControls.startRecording} className=' text-white text-sm'>Start recording</button> 
                          </div>
                        }                       
                    </PopoverContent>
                  </Popover> */}

                  {/* Upload  */}
                  {/* <Popover>
                    <PopoverTrigger> <LuGalleryVerticalEnd className='text-2xl text-gray-500'/> </PopoverTrigger>
                    <PopoverContent className='text-white flex flex-col justify-center'>
                          <input type="file" onChange={onFileChange} className='text-sm' />
                          <textarea value={imageCaption} onChange={e => setImageCaption(e.target.value)} placeholder='Enter Caption here if needed.' className='py-2 text-black text-sm placeholder:text-sm px-2 mt-2' />
                          {imageCaption ? <button onClick={handleImageCaption} className='bg-gray-600 px-4 rounded-xl py-2 text-sm mt-3 w-fit'>Send</button> : <button onClick={handleImage} className='bg-gray-600 px-4 rounded-xl py-2 text-sm mt-3 w-fit'>Send</button>}
                    </PopoverContent>
                  </Popover> */}
                </div>
              }
              
            </form>
        </div>
    </section>
  )
}

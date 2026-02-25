import React from 'react'
import './Chat.css';
import { IoSend } from "react-icons/io5";
const Chat = () => {
  return (
    <div>

        <div className='chat-container'>

            <div className='send-m-area'>
                <input type='text' placeholder='Type Message here....'></input>
                  <IoSend className='send-icon' />
            </div>

        </div>
    </div>
  )
}

export default Chat
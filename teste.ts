import MicRecorder from 'mic-recorder-to-mp3'
import { useState } from 'react'
import { AiFillAudio } from 'react-icons/ai'
import { FcOk, FcCancel } from 'react-icons/fc'
import { Flex, IconButton, useToast } from '@chakra-ui/react'
import api from '../../../../../services/api'
import { i18n } from '../../../../../translate/i18n'
import RecordingTimer from './RecorderTimer'

export const Recording = ({ ticket }) => {
  const toast = useToast()
  const [recording, setRecording] = useState(false)
  const [Mp3Recorder, setMp3Recorder] = useState(
    new MicRecorder({ bitRate: 128 })
  )

  const handleStartRecording = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
      await Mp3Recorder.start()
      setRecording(true)
    } catch (err: any) {
      toast({
        title: `${i18n.t('frontEndErrors.startRecording')}`,
        status: 'error',
        position: 'top-right',
        isClosable: true
      })
    }
  }

  const handleUploadAudio = async () => {
    try {
      const [, blob] = await Mp3Recorder.stop().getMp3()
      if (blob.size < 10000) {
        setRecording(false)
        return
      }

      const formData: any = new FormData()
      const filename = `${new Date().getTime()}.mp3`
      formData.append('medias', blob, filename)
      formData.append('body', filename)
      formData.append('fromMe', true)

      setRecording(false)

      if (ticket.status === 'open' && ticket.kind === 'chat') {
        await api.post(`/messages/${ticket.id}`, formData)
      }
      if (!ticket.status) {
        formData.append('internalChatId', ticket.id)

        await api.post(`/ichats/${ticket.id}/messages`, formData)
      }
      if (ticket.status === 'open' && ticket.kind === 'transmission') {
        await api.post(`/transmission/${ticket.id}/sendMessage`, formData)
      }
    } catch (err: any) {
      toast({
        title: `${i18n.t('frontEndErrors.uploadAudio')}`,
        status: 'error',
        position: 'top-right',
        isClosable: true
      })
    }
  }

  const handleCancelAudio = () => {
    try {
      Mp3Recorder.stop().getMp3()
      setRecording(false)
    } catch (err: any) {
      console.error(err.message)
    }
  }

  return recording ? (
    <Flex gap={5} mr={5} ml={5} p={2}>
      <FcCancel onClick={handleCancelAudio} fontSize={'22px'} />
      <RecordingTimer />
      <FcOk onClick={handleUploadAudio} fontSize={'22px'} />
    </Flex>
  ) : (
    <IconButton
      size="sm"
      onClick={handleStartRecording}
      icon={<AiFillAudio fontSize={'22px'} />}
      aria-label=""
      background="transparent"
    />
  )
}

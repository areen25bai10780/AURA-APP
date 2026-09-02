import { useCallback, useEffect, useRef, useState } from 'react'
import { getSocket } from '../api/socket'

const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }]

function getUserKey(user) {
  return String(user?.id || user?.email || 'guest-user')
}

export function useVoiceChannel(currentUser) {
  const [currentVoiceChannel, setCurrentVoiceChannel] = useState(null)
  const [participants, setParticipants] = useState([])
  const [isMuted, setIsMuted] = useState(false)
  const [error, setError] = useState('')
  const [remoteStreams, setRemoteStreams] = useState({})

  const localStreamRef = useRef(null)
  const peerConnectionsRef = useRef(new Map())
  const offeredPeersRef = useRef(new Set())
  const socketRef = useRef(null)
  const currentVoiceChannelRef = useRef(null)

  const closePeerConnection = useCallback((participantId) => {
    const peerConnection = peerConnectionsRef.current.get(participantId)
    if (peerConnection) {
      peerConnection.close()
      peerConnectionsRef.current.delete(participantId)
    }
    offeredPeersRef.current.delete(participantId)
    setRemoteStreams((previous) => {
      const next = { ...previous }
      delete next[participantId]
      return next
    })
  }, [])

  const stopLocalStream = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop())
      localStreamRef.current = null
    }
  }, [])

  const clearAllPeerConnections = useCallback(() => {
    peerConnectionsRef.current.forEach((peerConnection, participantId) => {
      peerConnection.close()
      offeredPeersRef.current.delete(participantId)
    })
    peerConnectionsRef.current.clear()
    setRemoteStreams({})
  }, [])

  const createPeerConnection = useCallback(
    (participantId) => {
      if (peerConnectionsRef.current.has(participantId)) {
        return peerConnectionsRef.current.get(participantId)
      }

      const socket = getSocket(currentUser)
      const peerConnection = new RTCPeerConnection({ iceServers: ICE_SERVERS })

      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach((track) => {
          peerConnection.addTrack(track, localStreamRef.current)
        })
      }

      peerConnection.onicecandidate = (event) => {
        if (!event.candidate) return

        socket.emit('voice:ice-candidate', {
          channelName: currentVoiceChannelRef.current,
          targetUserId: participantId,
          candidate: event.candidate,
        })
      }

      peerConnection.ontrack = (event) => {
        const remoteStream = event.streams?.[0]
        if (remoteStream) {
          setRemoteStreams((previous) => ({
            ...previous,
            [participantId]: remoteStream,
          }))
        }
      }

      peerConnectionsRef.current.set(participantId, peerConnection)
      return peerConnection
    },
    [currentUser]
  )

  const createOfferForPeer = useCallback(
    async (participantId) => {
      if (!currentVoiceChannelRef.current) return
      if (offeredPeersRef.current.has(participantId)) return

      const socket = getSocket(currentUser)
      const peerConnection = createPeerConnection(participantId)

      if (!peerConnection) return

      try {
        const offer = await peerConnection.createOffer()
        await peerConnection.setLocalDescription(offer)
        socket.emit('voice:offer', {
          channelName: currentVoiceChannelRef.current,
          targetUserId: participantId,
          offer,
        })
        offeredPeersRef.current.add(participantId)
      } catch (error) {
        console.error('Failed to create voice offer:', error)
        setError('WebRTC connection failed while setting up your call.')
      }
    },
    [createPeerConnection, currentUser]
  )

  const joinVoiceChannel = useCallback(
    async (channelName) => {
      if (!channelName) return
      if (!currentUser) {
        setError('Please sign in to join a voice channel.')
        return
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('This browser does not support microphone access.')
        return
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        localStreamRef.current = stream

        stream.getAudioTracks().forEach((track) => {
          track.enabled = !isMuted
        })

        currentVoiceChannelRef.current = channelName
        setCurrentVoiceChannel(channelName)
        setError('')
        setParticipants([])

        const socket = getSocket(currentUser)
        socketRef.current = socket
        socket.emit('voice:join', { channelName, user: currentUser })
      } catch (error) {
        console.error('Voice join error:', error)
        setError('Microphone permission is required to join voice chat.')
      }
    },
    [currentUser, isMuted]
  )

  const leaveVoiceChannel = useCallback(() => {
    const socket = socketRef.current || getSocket(currentUser)
    const channelName = currentVoiceChannelRef.current

    if (channelName) {
      socket.emit('voice:leave', { channelName })
    }

    stopLocalStream()
    clearAllPeerConnections()
    setParticipants([])
    setCurrentVoiceChannel(null)
    currentVoiceChannelRef.current = null
    setIsMuted(false)
    setError('')
  }, [clearAllPeerConnections, currentUser, stopLocalStream])

  const toggleMute = useCallback(() => {
    const nextMuted = !isMuted
    setIsMuted(nextMuted)

    const socket = socketRef.current || getSocket(currentUser)
    const channelName = currentVoiceChannelRef.current

    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !nextMuted
      })
    }

    if (channelName) {
      socket.emit('voice:mute-state', {
        channelName,
        muted: nextMuted,
      })
    }
  }, [currentUser, isMuted])

  useEffect(() => {
    const socket = getSocket(currentUser)
    socketRef.current = socket

    const handleParticipants = (nextParticipants) => {
      const selfUserId = getUserKey(currentUser)
      const nextList = (nextParticipants || []).map((participant) => ({
        ...participant,
        id: participant.id || participant.userId || participant.email || participant.name || 'guest-user',
      }))

      setParticipants(nextList)

      nextList.forEach((participant) => {
        const participantId = String(participant.id || participant.userId || participant.email || participant.name)
        if (participantId === selfUserId) return
        createPeerConnection(participantId)
      })

      peerConnectionsRef.current.forEach((_, participantId) => {
        if (!nextList.some((participant) => String(participant.id || participant.userId || participant.email || participant.name) === participantId)) {
          closePeerConnection(participantId)
        }
      })

      nextList.forEach((participant) => {
        const participantId = String(participant.id || participant.userId || participant.email || participant.name)
        if (participantId !== selfUserId) {
          createOfferForPeer(participantId)
        }
      })
    }

    const handleOffer = async ({ fromUserId, offer, channelName }) => {
      if (!currentVoiceChannelRef.current || channelName !== currentVoiceChannelRef.current) return
      const peerConnection = createPeerConnection(fromUserId)
      if (!peerConnection) return

      try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
        const answer = await peerConnection.createAnswer()
        await peerConnection.setLocalDescription(answer)
        socket.emit('voice:answer', {
          channelName: currentVoiceChannelRef.current,
          targetUserId: fromUserId,
          answer,
        })
      } catch (error) {
        console.error('Voice offer handling failed:', error)
      }
    }

    const handleAnswer = async ({ fromUserId, answer, channelName }) => {
      if (!currentVoiceChannelRef.current || channelName !== currentVoiceChannelRef.current) return
      const peerConnection = peerConnectionsRef.current.get(fromUserId)
      if (!peerConnection) return

      try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer))
      } catch (error) {
        console.error('Voice answer handling failed:', error)
      }
    }

    const handleCandidate = async ({ fromUserId, candidate, channelName }) => {
      if (!currentVoiceChannelRef.current || channelName !== currentVoiceChannelRef.current) return
      const peerConnection = peerConnectionsRef.current.get(fromUserId)
      if (!peerConnection || !candidate) return

      try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
      } catch (error) {
        console.error('ICE candidate handling failed:', error)
      }
    }

    const handleParticipantLeft = ({ userId, channelName }) => {
      if (!currentVoiceChannelRef.current || channelName !== currentVoiceChannelRef.current) return
      closePeerConnection(userId)
      setParticipants((previousParticipants) => previousParticipants.filter((participant) => {
        const participantKey = String(participant.id || participant.userId || participant.email || participant.name)
        return participantKey !== String(userId)
      }))
    }

    socket.on('voice:participants', handleParticipants)
    socket.on('voice:offer', handleOffer)
    socket.on('voice:answer', handleAnswer)
    socket.on('voice:ice-candidate', handleCandidate)
    socket.on('voice:participant-left', handleParticipantLeft)

    return () => {
      socket.off('voice:participants', handleParticipants)
      socket.off('voice:offer', handleOffer)
      socket.off('voice:answer', handleAnswer)
      socket.off('voice:ice-candidate', handleCandidate)
      socket.off('voice:participant-left', handleParticipantLeft)
    }
  }, [closePeerConnection, createOfferForPeer, createPeerConnection, currentUser])

  useEffect(() => {
    return () => {
      leaveVoiceChannel()
    }
  }, [leaveVoiceChannel])

  return {
    currentVoiceChannel,
    participants,
    isMuted,
    error,
    remoteStreams,
    joinVoiceChannel,
    leaveVoiceChannel,
    toggleMute,
  }
}

export default useVoiceChannel

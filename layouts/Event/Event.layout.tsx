import {
    AspectRatio,
    Box,
    Flex,
    Text,
    Image,
    Button,
    Divider,
    Avatar,
    AvatarGroup,
    Modal,
    ModalBody,
    ModalContent,
    Link,
    InputGroup,
    InputRightElement,
    InputLeftElement,
    Input,
    ModalOverlay,
    useClipboard,
    IconButton,
    Fade,
} from '@chakra-ui/react'
import { useState, useContext, useEffect } from 'react'
import ReactPlayer from 'react-player'
import { Event } from '../../types/Event.type'
import '@uiw/react-md-editor/markdown-editor.css'
import '@uiw/react-markdown-preview/markdown.css'
import dynamic from 'next/dynamic'
import moment from 'moment'
import { motion } from 'framer-motion'
import { walletContext } from '../../utils/walletContext'
import { ethers } from 'ethers'
import { BsCalendarPlus } from 'react-icons/bs'
import abi from '../../utils/Metapass.json'
import youtubeThumbnail from 'youtube-thumbnail'
const MarkdownPreview = dynamic(() => import('@uiw/react-markdown-preview'), {
    ssr: false,
})
import toast from 'react-hot-toast'
import { IoIosLink } from 'react-icons/io'
import Confetti from '../../components/Misc/Confetti.component'
import { ticketToIPFS } from '../../utils/imageHelper'
import toGoogleCalDate from '../../utils/parseIsoDate'
import BoringAva from '../../utils/BoringAva'
import { getAllEnsLinked } from '../../utils/resolveEns'
import { decryptLink } from '../../utils/linkResolvers'
import LinkMagic from '../../utils/Magic'
import generateAndSendUUID from '../../utils/generateAndSendUUID'
import GenerateQR from '../../utils/generateQR'
import useCheckMobileScreen from '../../utils/useMobileDetect'
import useMobileDetect from '../../utils/useMobileDetect'

import { auth } from '../../utils/firebaseUtils'
import { onAuthStateChanged } from 'firebase/auth'
import { send } from '@metapasshq/msngr'
import { useRouter } from 'next/router'
import { JsonRpcError, RPCError } from 'magic-sdk'
import { EthereumRpcError } from 'eth-rpc-errors'
import { SerializedEthereumRpcError } from 'eth-rpc-errors/dist/classes'

declare const window: any

export default function EventLayout({
    event,
    address,
}: {
    event: Event
    address: string
}) {
    const [image, setImage] = useState(event.image.image)
    const [mediaType, setMediaType] = useState(
        event.image.video ? 'video' : 'image'
    )
    const [mintedImage, setMintedImage] = useState<string>('')
    const [eventLink, setEventLink] = useState<string>('')
    const { hasCopied, value, onCopy } = useClipboard(eventLink as string)
    const [hasBought, setHasBought] = useState<boolean>(false)
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [ensName, setEnsName] = useState<string>('')
    const [openseaLink, setOpenseaLink] = useState<string>('')
    const [qrId, setQrId] = useState<string>('')
    const currentDevice = useMobileDetect()
    let opensea =
        process.env.NEXT_PUBLIC_ENV === 'dev'
            ? 'https://testnets.opensea.io/assets/mumbai'
            : 'https://opensea.io/assets/matic'

    const months = [
        'JAN',
        'FEB',
        'MAR',
        'APR',
        'MAY',
        'JUN',
        'JUL',
        'AUG',
        'SEP',
        'OCT',
        'NOV',
        'DEC',
    ]

    const [user, setUser] = useState<any>()
    const router = useRouter()

    onAuthStateChanged(auth, (user) => {
        user ? setUser(user) : setUser(null)
    })

    const [wallet] = useContext(walletContext)
    const buyTicket = async () => {
        // console.log('user', user)

        if (user) {
            // console.log('user not undefined')

            if (wallet.address) {
                if (typeof window.ethereum != undefined) {
                    const { magic, web3, network } = LinkMagic(
                        process.env.NEXT_PUBLIC_ENV as string
                    )
                    console.log(wallet.type)
                    const provider = new ethers.providers.Web3Provider(
                        wallet.type === 'magic'
                            ? magic.rpcProvider
                            : wallet.type === 'wc'
                            ? window.w3.currentProvider
                            : window.ethereum
                    )
                    setIsLoading(true)
                    const signer = provider.getSigner()
                    let metapass = new ethers.Contract(
                        event.childAddress,
                        abi.abi,
                        signer
                    )
                    console.log('created contract')
                    console.log('creating image')
                    // toast.loading("Creating a custom ticket just fo you",{})
                    const ticketImagePromise = ticketToIPFS(
                        event.title,
                        event.tickets_sold + 1,
                        event.image.image,
                        event.date.split('T')[0],
                        wallet?.ens ||
                            wallet?.address?.substring(0, 4) +
                                '...' +
                                wallet?.address?.substring(
                                    wallet?.address?.length - 4
                                )
                    )
                    toast.promise(ticketImagePromise, {
                        loading: 'Processing your custom ticket 😊',
                        success: 'Ticket processed!',
                        error: 'Uh oh looks likes theres an issue, contact us in our discord',
                    })
                    let { img, fastimg } = await ticketImagePromise
                    console.log('img created')
                    setMintedImage(fastimg)
                    // setMintedImage(event.image.image)
                    let metadata = {
                        name: event.title,
                        description: `NFT Ticket for ${event.title}`,
                        image: img,
                        properties: {
                            'Ticket Number': event.tickets_sold + 1,
                        },
                    }

                    try {
                        console.log('starting the minting')
                        const mintPromise: Promise<any> = metapass.getTix(
                            JSON.stringify(metadata),
                            {
                                value: ethers.utils.parseEther(
                                    event.fee.toString()
                                ),
                            }
                        )
                        toast.promise(mintPromise, {
                            loading: 'Minting your ticket 🎫',
                            success: 'Ticket minted!',
                            error: 'Uh oh looks likes theres an issue, contact us in our discord',
                        })
                        mintPromise
                            .then(() => {
                                console.log('Success! Minted!')
                                // setIsLoading(false)
                                toast.success(
                                    'Ticket Minted! Your txn might take a few seconds to confirm'
                                )
                            })
                            .catch(async (err: any) => {
                                const log = {
                                    author: {
                                        name: user?.displayName,
                                        url: `https://mailto-forwarder.vercel.app/?email=${user?.email}`,
                                        iconURL:
                                            user?.photoURL ||
                                            'https://i.imgur.com/R66g1Pe.jpg',
                                    },
                                    title: err?.data?.message,
                                    url: window.location.href,
                                    description: err.message,
                                    color: 14423100,
                                    fields: [
                                        {
                                            name: 'code',
                                            value: err.data.code,
                                            inline: true,
                                        },
                                        {
                                            name: 'Wallet Address',
                                            value: wallet?.address,
                                            inline: false,
                                        },
                                        {
                                            name: 'Event Address',
                                            value: event.childAddress,
                                            inline: false,
                                        },
                                        {
                                            name: 'Ticket ID',
                                            value: String(
                                                event.tickets_sold + 1
                                            ),
                                        },
                                        {
                                            name: 'Event',
                                            value: event.title,
                                        },
                                    ],
                                    thumbnail: {
                                        url: 'https://upload.wikimedia.org/wikipedia/commons/3/38/4-Nature-Wallpapers-2014-1_ukaavUI.jpg',
                                    },
                                    image: {
                                        url: 'https://upload.wikimedia.org/wikipedia/commons/5/5a/A_picture_from_China_every_day_108.jpg',
                                    },
                                    footer: {
                                        text: 'Oops',
                                        iconURL: '',
                                    },
                                }
                                console.log(
                                    'error in mint line 175 event.layout.tsx',
                                    err
                                )
                                await send(
                                    process.env.NEXT_PUBLIC_MILADY as string,
                                    {
                                        embeds: [log],
                                    }
                                )
                                toast.error(err?.data?.message as string, {
                                    id: 'error10',
                                    style: {
                                        fontSize: '12px',
                                    },
                                })
                                setIsLoading(false)
                            })
                    } catch (err: any) {
                        console.log('Error in line 214 Event.layout.tsx', err)
                        const log = {
                            author: {
                                name: user?.displayName,
                                url: `https://mailto-forwarder.vercel.app/?email=${user?.email}`,
                                iconURL:
                                    user?.photoURL ||
                                    'https://i.imgur.com/R66g1Pe.jpg',
                            },
                            title: err?.data?.message,
                            url: window.location.href,
                            description: err.message,
                            color: 14423100,
                            fields: [
                                {
                                    name: 'code',
                                    value: err.data.code,
                                    inline: true,
                                },
                                {
                                    name: 'Wallet Address',
                                    value: wallet?.address,
                                    inline: false,
                                },
                                {
                                    name: 'Event Address',
                                    value: event.childAddress,
                                    inline: false,
                                },
                                {
                                    name: 'Ticket ID',
                                    value: String(event.tickets_sold + 1),
                                },
                                {
                                    name: 'Event',
                                    value: event.title,
                                },
                            ],
                            thumbnail: {
                                url: 'https://upload.wikimedia.org/wikipedia/commons/3/38/4-Nature-Wallpapers-2014-1_ukaavUI.jpg',
                            },
                            image: {
                                url: 'https://upload.wikimedia.org/wikipedia/commons/5/5a/A_picture_from_China_every_day_108.jpg',
                            },
                            footer: {
                                text: 'Oops',
                                iconURL: '',
                            },
                        }
                        await send(process.env.NEXT_PUBLIC_MILADY as string, {
                            embeds: [log],
                        })
                        toast.error(err?.data?.message as string, {
                            id: 'error10',
                            style: {
                                fontSize: '12px',
                            },
                        })
                        setIsLoading(false)
                    }

                    metapass.on('Transfer', (res) => {
                        // toast.success('Redirecting to opensea in a few seconds')

                        setIsLoading(false)
                        setHasBought(true)
                        event.category.event_type == 'In-Person' &&
                            generateAndSendUUID(
                                event.childAddress,
                                wallet.address,
                                event.tickets_sold + 1
                            ).then((uuid) => {
                                setQrId(String(uuid))
                            })
                        let link =
                            opensea +
                            '/' +
                            event.childAddress +
                            '/' +
                            ethers.BigNumber.from(res).toNumber()

                        setOpenseaLink(link)
                    })
                } else {
                    console.log("Couldn't find ethereum enviornment")
                }
            } else {
                toast('Please connect your wallet')
            }
        } else {
            router.push(`/account?event_id=${address}`)
        }

        // console.log(eventLink)
    }
    useEffect(() => {
        getAllEnsLinked(event.owner)
            .then((data) => {
                if (data?.data?.domains && data && data?.data) {
                    console.log(
                        data?.data?.domains?.length,
                        data?.data?.domains?.length > 0 &&
                            data?.data?.domains[data?.data?.domains.length - 1]
                                .name
                    )
                    const ens_name =
                        data?.data?.domains?.length > 0 &&
                        data?.data?.domains[data?.data?.domains.length - 1].name
                    setEnsName(ens_name)
                }
            })
            .catch((err) => {
                console.log(err)
            })
        // console.log(wallet)
    }, [event.owner])

    useEffect(() => {
        console.log(event.link)

        // console.log(currentDevice.isMobile(), 'is mobile')
        if (event.link) {
            const exceptions = [
                'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'https://thememe.club',
                'https://in.bookmyshow.com/events/are-you-kidding-me-ft-karunesh-talwar/ET00322058',
            ]
            if (!exceptions.includes(event.link)) {
                const declink = decryptLink(event.link)
                console.log(declink, 'if')
                setEventLink(declink)
            } else {
                console.log(event.link, 'else')
                setEventLink(event.link)
            }
            // console.log(eventLink,value)
        }
    }, [])

    const [isDisplayed, setIsDisplayed] = useState(false)
    // const {isOpen:isTicketOpen, onOpen:onTicketOpen, onClose:onTicketClose} = useDisclosure();
    useEffect(() => {
        if (hasBought) {
            setInterval(() => {
                setIsDisplayed(true)
            }, 5000)
        }
    }, [hasBought])

    return (
        <>
            {/* {notAuthed && (
                <SignUpModal
                    isOpen={isOpen}
                    onOpen={onOpen}
                    onClose={onClose}
                />
            )} */}
            {hasBought && <Confetti />}
            <Modal isOpen={!isDisplayed && hasBought} onClose={() => {}}>
                <ModalOverlay />
                <ModalContent rounded="2xl" bgColor={'transparent'}>
                    <motion.div
                        animate={{ scale: [0, 1.3, 1] }}
                        transition={{ ease: 'easeOut', duration: 3 }}
                    >
                        <Image
                            src={mintedImage}
                            loading="lazy"
                            alt="ticket"
                            m="2"
                        ></Image>
                    </motion.div>
                </ModalContent>
            </Modal>
            <Fade>
                <Modal isOpen={isDisplayed} onClose={() => {}}>
                    <ModalOverlay />
                    <ModalContent rounded="2xl">
                        <ModalBody textAlign="center">
                            <motion.div
                                animate={{ translateY: [0, -20, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <Image
                                    src={mintedImage}
                                    alt="ticket"
                                    m="2"
                                    loading="lazy"
                                ></Image>
                            </motion.div>
                            <Box color="blackAlpha.700" fontSize="sm">
                                <Text
                                    fontFamily="body"
                                    fontSize="lg"
                                    color="blackAlpha.800"
                                >
                                    Radical! 🎊
                                </Text>
                                <Text mt="2">
                                    Enjoy your time at {event.title}
                                </Text>
                                <Text mt="2">
                                    The ticket has been sent to your wallet.🥂
                                </Text>
                                <Text mt="2">
                                    Spread the word, share this event via{' '}
                                </Text>
                            </Box>
                            <Flex
                                mx="auto"
                                mt="2"
                                justify="center"
                                experimental_spaceX="2"
                                align="center"
                            >
                                <Box
                                    p="2"
                                    bg="white"
                                    transitionDuration="100ms"
                                    cursor="pointer"
                                    boxShadow="0px 4.61667px 92.3333px rgba(0, 0, 0, 0.15)"
                                    rounded="full"
                                    _hover={{ shadow: 'md' }}
                                >
                                    <Image
                                        src="/assets/twitter.png"
                                        w="5"
                                        alt="twitter"
                                        onClick={() => {
                                            window.open(
                                                `http://twitter.com/share?text=I bought my NFT Ticket for ${event.title} on metapass. Get yours now!&url=https://metapasshq.xyz/event/${event.childAddress}`,
                                                '_blank'
                                            )
                                        }}
                                    />
                                </Box>

                                <Box
                                    p="2"
                                    bg="white"
                                    transitionDuration="100ms"
                                    cursor="pointer"
                                    boxShadow="0px 4.61667px 92.3333px rgba(0, 0, 0, 0.15)"
                                    rounded="full"
                                    onClick={() => {
                                        window.open(
                                            `https://api.whatsapp.com/send?text=I just bought NFT Ticket to ${event.title} on Metapass. Get yours at https://metapasshq.xyz/event/${event.childAddress}`
                                        )
                                    }}
                                    _hover={{ shadow: 'md' }}
                                >
                                    <Image
                                        src="/assets/whatsapp.png"
                                        w="5"
                                        alt="whatsapp"
                                    />
                                </Box>
                                <Box
                                    p="2"
                                    bg="white"
                                    transitionDuration="100ms"
                                    cursor="pointer"
                                    boxShadow="0px 4.61667px 92.3333px rgba(0, 0, 0, 0.15)"
                                    rounded="full"
                                    onClick={() => {
                                        window.open(
                                            `https://telegram.me/share/url?url=https://metapasshq.xyz/event/${event.childAddress}&text=I just bought my NFT Ticket to ${event.title} on Metapass. Get yours now`,
                                            '_blank'
                                        )
                                    }}
                                    _hover={{ shadow: 'md' }}
                                >
                                    <Image
                                        src="/assets/telegram.png"
                                        w="5"
                                        alt="telegram"
                                    />
                                </Box>
                                <Box
                                    p="2"
                                    bg="white"
                                    transitionDuration="100ms"
                                    cursor="pointer"
                                    boxShadow="0px 4.61667px 92.3333px rgba(0, 0, 0, 0.15)"
                                    rounded="full"
                                    _hover={{ shadow: 'md' }}
                                    onClick={() => {
                                        window.open(openseaLink, '_blank')
                                    }}
                                >
                                    <Image
                                        src="/assets/opensea.png"
                                        w="5"
                                        alt="opensea"
                                        borderRadius="full"
                                    />
                                </Box>
                            </Flex>
                            <Text color="blackAlpha.700" fontSize="sm" mt="2">
                                {event.category.event_type == 'In-Person'
                                    ? 'Save this QR Code'
                                    : 'Or copy this link'}
                            </Text>
                            {event.category.event_type != 'In-Person' && (
                                <>
                                    <InputGroup mt="4">
                                        <InputLeftElement>
                                            <IoIosLink />
                                        </InputLeftElement>
                                        <Input
                                            rounded="full"
                                            fontSize="xs"
                                            value={eventLink}
                                            readOnly
                                        />
                                        <InputRightElement mr="6">
                                            <Button
                                                onClick={onCopy}
                                                _hover={{}}
                                                _focus={{}}
                                                _active={{}}
                                                rounded="full"
                                                color="white"
                                                bg="brand.gradient"
                                                fontWeight="normal"
                                                fontSize="sm"
                                                px="12"
                                                roundedBottomLeft="none"
                                            >
                                                {hasCopied
                                                    ? 'Copied'
                                                    : 'Copy Link'}
                                            </Button>
                                        </InputRightElement>{' '}
                                    </InputGroup>
                                    <Box
                                        p="1.5px"
                                        mx="auto"
                                        mt="6"
                                        transitionDuration="200ms"
                                        rounded="full"
                                        w="fit-content"
                                        boxShadow="0px 5px 33px rgba(0, 0, 0, 0.08)"
                                        bg="brand.gradient"
                                        _hover={{ transform: 'scale(1.05)' }}
                                        _focus={{}}
                                        _active={{ transform: 'scale(0.95)' }}
                                    >
                                        <Button
                                            type="submit"
                                            rounded="full"
                                            bg="white"
                                            size="sm"
                                            color="blackAlpha.700"
                                            fontWeight="medium"
                                            _hover={{}}
                                            leftIcon={
                                                <Box
                                                    _groupHover={{
                                                        transform: 'scale(1.1)',
                                                    }}
                                                    transitionDuration="200ms"
                                                >
                                                    <Image
                                                        src="/assets/elements/event_ticket_gradient.svg"
                                                        w="4"
                                                        alt="ticket"
                                                    />
                                                </Box>
                                            }
                                            _focus={{}}
                                            _active={{}}
                                            onClick={() => {
                                                window.open(eventLink, '_blank')
                                            }}
                                            role="group"
                                        >
                                            Go to event
                                        </Button>
                                    </Box>
                                </>
                            )}
                            {event.category.event_type == 'In-Person' && (
                                <Flex justify="center">
                                    <Box
                                        borderRadius="2xl"
                                        border="1px"
                                        borderColor="blackAlpha.200"
                                        boxShadow="0px -4px 52px rgba(0, 0, 0, 0.11)"
                                    >
                                        {' '}
                                        <GenerateQR data={qrId} />
                                    </Box>
                                </Flex>
                            )}
                            <Box mt="2" mb="4">
                                <Link
                                    fontSize="sm"
                                    href="/"
                                    color="blackAlpha.600"
                                >
                                    Back to home
                                </Link>
                            </Box>
                        </ModalBody>
                    </ModalContent>
                </Modal>
            </Fade>
            <Box pt="3" color="brand.black" mb="4">
                <Flex
                    justify="space-between"
                    align={{ md: 'center' }}
                    flexDir={{ base: 'column', md: 'row' }}
                    //   border="1px solid red"
                >
                    <Box pl={{ md: '2' }}>
                        <Text fontSize="2xl" fontWeight="semibold">
                            {event.title}
                        </Text>
                        <Flex
                            experimental_spaceX="2"
                            color="blackAlpha.600"
                            mt="1"
                        >
                            <Box
                                boxShadow="0px 0px 31.1248px rgba(0, 0, 0, 0.08)"
                                rounded="full"
                                fontSize="10px"
                                fontWeight="semibold"
                                border="1px"
                                borderColor="blackAlpha.200"
                                px="2"
                                py="0.5"
                                bg="white"
                            >
                                {event.type || event.category.event_type}
                            </Box>
                            <Box
                                boxShadow="0px 0px 31.1248px rgba(0, 0, 0, 0.08)"
                                rounded="full"
                                fontSize="10px"
                                fontWeight="semibold"
                                border="1px"
                                borderColor="blackAlpha.200"
                                px="2"
                                py="0.5"
                                bg="white"
                            >
                                {Array(event.category.category).join(' & ')}
                            </Box>
                        </Flex>
                    </Box>

                    <Button
                        display={{ base: 'none', md: 'flex' }}
                        rounded="full"
                        bg="brand.gradient"
                        fontWeight="medium"
                        role="group"
                        loadingText="Minting"
                        isLoading={isLoading}
                        boxShadow="0px 4px 32px rgba(0, 0, 0, 0.12)"
                        color="white"
                        _disabled={{
                            opacity: '0.8',
                            cursor: 'not-allowed',
                        }}
                        _hover={{}}
                        onClick={buyTicket}
                        disabled={event.tickets_available === 0}
                        _focus={{}}
                        _active={{}}
                        w={{ base: '70%', md: 'auto' }}
                        mr="3"
                        leftIcon={
                            <Box
                                _groupHover={{ transform: 'scale(1.1)' }}
                                transitionDuration="200ms"
                            >
                                <Image
                                    src="/assets/elements/event_ticket.svg"
                                    w={{ base: '6', md: '5' }}
                                    alt="ticket"
                                />
                            </Box>
                        }
                    >
                        {event.tickets_available === 0
                            ? 'Sold Out'
                            : 'Buy Ticket'}
                        {/* {
                                console.log(event.tickets_available, event.tickets_sold,"here here")
                            } */}
                    </Button>
                </Flex>
                <Flex
                    align="start"
                    mt="4"
                    experimental_spaceX={{ base: '0', md: '6' }}
                    justify="space-between"
                    flexDirection={{ base: 'column', md: 'row' }}
                >
                    <Box w="full">
                        <Box
                            w="full"
                            overflow="clip"
                            border="1px"
                            borderColor="blackAlpha.100"
                            boxShadow="0px 4.25554px 93.6219px rgba(0, 0, 0, 0.08)"
                            rounded="xl"
                            p="3"
                        >
                            <Flex
                                alignItems={{
                                    base: 'stretch',
                                    md: 'end',
                                }}
                                experimental_spaceX="4"
                                flexDir={{ base: 'column', md: 'row' }}
                            >
                                <AspectRatio
                                    ratio={16 / 9}
                                    w="full"
                                    rounded="lg"
                                    overflow="hidden"
                                >
                                    {mediaType === 'video' ? (
                                        <Flex
                                            justify="center"
                                            align="center"
                                            w="full"
                                        >
                                            <ReactPlayer
                                                height="100%"
                                                width="100%"
                                                url={event.image.video}
                                            />
                                        </Flex>
                                    ) : (
                                        <Image
                                            src={image}
                                            alt={'Event Image'}
                                        /> // @ts-ignore
                                    )}
                                </AspectRatio>
                                <Box
                                    maxH={{ base: '26vw', xl: '300px' }}
                                    minW={{
                                        md: '100px',
                                        lg: '130px',
                                    }}
                                    overflowY="auto"
                                >
                                    <Flex
                                        py={{ base: '2', md: '1' }}
                                        px="1"
                                        flexDir={{
                                            base: 'row',
                                            md: 'column',
                                        }}
                                        minW={{
                                            base: '60px',
                                            md: '90px',
                                            lg: '110px',
                                        }}
                                        experimental_spaceY="2"
                                    >
                                        {event.image.video && (
                                            <AspectRatio
                                                cursor="pointer"
                                                _hover={{
                                                    filter: 'brightness(90%)',
                                                }}
                                                transitionDuration="100ms"
                                                onClick={() => {
                                                    setMediaType('video')
                                                }}
                                                ratio={16 / 9}
                                                w="full"
                                                ringColor="brand.peach"
                                                ring={
                                                    mediaType === 'video'
                                                        ? '2px'
                                                        : 'none'
                                                }
                                                rounded="md"
                                                overflow="hidden"
                                            >
                                                <Image
                                                    src={
                                                        youtubeThumbnail(
                                                            event.image.video
                                                        ).default.url
                                                            ? youtubeThumbnail(
                                                                  event.image
                                                                      .video
                                                              ).default.url
                                                            : 'https://pdtxar.com/wp-content/uploads/2019/11/video-placeholder-1280x720-40-768x433.jpg'
                                                    }
                                                    alt={'thumbnail'}
                                                />
                                            </AspectRatio>
                                        )}
                                        {/* {console.log(image.hero_image,"hero_image")} */}
                                        {event.image.gallery?.map(
                                            (data, key) => (
                                                <AspectRatio
                                                    key={key}
                                                    cursor="pointer"
                                                    _hover={{
                                                        filter: 'brightness(90%)',
                                                    }}
                                                    transitionDuration="100ms"
                                                    onClick={() => {
                                                        setImage(data)
                                                        setMediaType('image')
                                                    }}
                                                    ratio={16 / 9}
                                                    w="full"
                                                    mx={{ base: '1', md: '0' }}
                                                    ringColor="brand.peach"
                                                    ring={
                                                        image === data &&
                                                        mediaType === 'image'
                                                            ? '2px'
                                                            : 'none'
                                                    }
                                                    rounded="md"
                                                    overflow="hidden"
                                                >
                                                    <Image
                                                        src={data}
                                                        alt={data}
                                                    />
                                                </AspectRatio>
                                            )
                                        )}
                                    </Flex>
                                </Box>
                            </Flex>
                        </Box>
                        <Box
                            w="full"
                            mt="2"
                            mb={{ base: '10px', md: '0' }}
                            noOfLines={6}
                            border="1px"
                            borderColor="blackAlpha.100"
                            boxShadow="0px 4.25554px 93.6219px rgba(0, 0, 0, 0.08)"
                            rounded="xl"
                            p="3"
                            fontFamily="body"
                            px="4"
                            color="blackAlpha.700"
                            fontSize={{ base: 'sm', lg: 'md' }}
                            // minH={{ base: '28', xl: '28' }}
                            // maxW="10%"
                            // h="10rem"
                            minH={{ base: '4rem', md: 'auto' }}
                            maxH={{ base: '14rem', md: 'auto' }}
                            maxW="740px"
                            overflow="auto"
                        >
                            <Box>
                                <MarkdownPreview
                                    style={{
                                        fontSize: event.description.long_desc
                                            ? '12px'
                                            : '14px',
                                        overflow: 'auto',
                                    }}
                                    source={
                                        event.description.long_desc ||
                                        event.description.short_desc
                                    }
                                />
                            </Box>
                        </Box>

                        <Flex
                            justify="center"
                            display={{ base: 'flex', md: 'none' }}
                        >
                            <Button
                                rounded="full"
                                bg="brand.gradient"
                                fontWeight="medium"
                                role="group"
                                loadingText="Minting"
                                isLoading={isLoading}
                                boxShadow="0px 4px 32px rgba(0, 0, 0, 0.12)"
                                color="white"
                                _disabled={{
                                    opacity: '0.8',
                                    cursor: 'not-allowed',
                                }}
                                _hover={{}}
                                onClick={buyTicket}
                                disabled={event.tickets_available === 0}
                                _focus={{}}
                                _active={{}}
                                w={{ base: '90%', md: 'auto' }}
                                my="4"
                                leftIcon={
                                    <Box
                                        _groupHover={{
                                            transform: 'scale(1.1)',
                                        }}
                                        transitionDuration="200ms"
                                    >
                                        <Image
                                            src="/assets/elements/event_ticket.svg"
                                            w={{ base: '6', md: '5' }}
                                            alt="ticket"
                                        />
                                    </Box>
                                }
                            >
                                {event.tickets_available === 0
                                    ? 'Sold Out'
                                    : 'Buy Ticket'}
                                {/* {
                                console.log(event.tickets_available, event.tickets_sold,"here here")
                            } */}
                            </Button>
                        </Flex>
                    </Box>
                    <Flex direction="column" w={{ base: 'full', md: 'auto' }}>
                        <Flex
                            experimental_spaceX="2.5"
                            w={{ base: 'full', md: 'auto' }}
                        >
                            <Box
                                p="2"
                                border="1px"
                                borderColor="blackAlpha.100"
                                rounded="xl"
                                textAlign="center"
                                w={{ base: 'full', md: 'auto' }}
                                minW={{ base: 'auto', md: '100px' }}
                                boxShadow="0px 3.98227px 87.61px rgba(0, 0, 0, 0.08)"
                            >
                                <Text fontSize="xs" color="blackAlpha.700">
                                    Ticket Price
                                </Text>
                                <Divider my="2" />
                                <Box w="fit-content" mx="auto">
                                    <Image
                                        src="/assets/matic.png"
                                        alt="matic"
                                        w="6"
                                        h="6"
                                    />
                                </Box>
                                <Text
                                    fontSize={event.fee === 0 ? 'lg' : '2xl'}
                                    fontWeight="semibold"
                                    mt={event.fee === 0 ? '1.5' : '0'}
                                >
                                    {event.fee === 0 ? 'FREE' : event.fee}
                                </Text>
                            </Box>
                            <Box
                                p="2"
                                border="1px"
                                borderColor="blackAlpha.100"
                                rounded="xl"
                                textAlign="center"
                                w={{ base: 'full', md: 'auto' }}
                                minW={{ base: 'auto', md: '100px' }}
                                boxShadow="0px 3.98227px 87.61px rgba(0, 0, 0, 0.08)"
                            >
                                <Text fontSize="xs" color="blackAlpha.700">
                                    Event Date
                                </Text>
                                <Divider my="2" />
                                <Text color="brand.peach">
                                    {
                                        months[
                                            new Date(
                                                Date.parse(
                                                    event.date.split('T')[0]
                                                )
                                            ).getMonth()
                                        ]
                                    }
                                </Text>
                                <Text fontSize="2xl" fontWeight="semibold">
                                    {new Date(
                                        Date.parse(event.date.split('T')[0])
                                    ).getDate()}
                                </Text>
                            </Box>
                        </Flex>
                        <Box
                            mt="3"
                            rounded="xl"
                            px="4"
                            border="1px"
                            borderColor="blackAlpha.100"
                            boxShadow="0px 3.98227px 87.61px rgba(0, 0, 0, 0.08)"
                            py="2"
                        >
                            <Text color="blackAlpha.500" fontSize="xs">
                                Hosted By
                            </Text>
                            <Flex mt="2" direction="column" mb="1">
                                <Flex
                                    experimental_spaceX="2"
                                    align="center"
                                    _hover={{ bg: 'blackAlpha.50' }}
                                    mx="-4"
                                    px="4"
                                    py="2"
                                    cursor="pointer"
                                    transitionDuration="100ms"
                                >
                                    <BoringAva address={event.owner} />
                                    <Box>
                                        <Text fontSize="14px">
                                            {ensName ||
                                                event.owner.substring(0, 6) +
                                                    '...' +
                                                    event?.owner.substring(
                                                        event?.owner?.length - 6
                                                    )}
                                        </Text>
                                    </Box>
                                </Flex>
                            </Flex>
                        </Box>
                        <Box
                            mt="3"
                            rounded="xl"
                            px="4"
                            border="1px"
                            borderColor="blackAlpha.100"
                            boxShadow="0px 3.98227px 87.61px rgba(0, 0, 0, 0.08)"
                            py="2"
                        >
                            <Text color="blackAlpha.500" fontSize="xs">
                                Recent Buyers
                            </Text>
                            {event.buyers?.length > 0 ? (
                                <AvatarGroup
                                    mt="2"
                                    size="sm"
                                    max={6}
                                    fontSize="xs"
                                    spacing={-2}
                                >
                                    {event.buyers
                                        ?.reverse()
                                        .map((data, key) => {
                                            const { id }: any = data
                                            // console.log(data)
                                            return (
                                                <Box
                                                    _hover={{ zIndex: 10 }}
                                                    key={key}
                                                    cursor="pointer"
                                                >
                                                    <BoringAva
                                                        address={id}
                                                        key={key}
                                                    />
                                                </Box>
                                            )
                                        })}
                                </AvatarGroup>
                            ) : (
                                <Text fontSize={13}>
                                    You&apos;re the first one here!
                                </Text>
                            )}
                        </Box>
                        <Box
                            mt="3"
                            rounded="xl"
                            px="4"
                            border="1px"
                            borderColor="blackAlpha.100"
                            boxShadow="0px 3.98227px 87.61px rgba(0, 0, 0, 0.08)"
                            py="2"
                        >
                            <Flex justify="space-between" align="center">
                                <Text color="blackAlpha.500" fontSize="xs">
                                    Tickets Sold
                                </Text>
                                <Flex fontSize="xs" align="center">
                                    <Text
                                        fontWeight="bold"
                                        style={{
                                            background:
                                                '-webkit-linear-gradient(360deg, #95E1FF 0%, #E7B0FF 51.58%, #FFD27B 111.28%)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                        }}
                                    >
                                        {event.tickets_sold}
                                    </Text>
                                    <Text fontSize="xx-small">/</Text>
                                    <Text> {event.seats}</Text>
                                </Flex>
                            </Flex>
                            <Flex
                                w="full"
                                h="5"
                                bg="brand.gradient"
                                rounded="full"
                                mt="2"
                                justify="end"
                                overflow="hidden"
                            >
                                {/* {console.log((event.tickets_sold / event.seats) * 100, event.seats,event.title,event.tickets_sold,"perc")} */}
                                <Box
                                    w={`${
                                        100 -
                                        (event.tickets_sold / event.seats) * 100
                                    }%`}
                                    h="full"
                                    bg="gray.100"
                                />
                            </Flex>
                        </Box>
                        {event.buyers.find(
                            (buyer: any) =>
                                String(buyer.id).toLowerCase() ===
                                String(wallet.address).toLowerCase()
                        ) && (
                            <Flex align="center" justify="space-evenly">
                                <Box
                                    p="1.5px"
                                    mx="auto"
                                    mt="6"
                                    transitionDuration="200ms"
                                    rounded="full"
                                    w="fit-content"
                                    boxShadow="0px 5px 33px rgba(0, 0, 0, 0.08)"
                                    bg="brand.gradient"
                                    _hover={{ transform: 'scale(1.05)' }}
                                    _focus={{}}
                                    _active={{ transform: 'scale(0.95)' }}
                                >
                                    <Button
                                        type="submit"
                                        rounded="full"
                                        bg="white"
                                        size="sm"
                                        color="blackAlpha.700"
                                        fontWeight="medium"
                                        _hover={{}}
                                        leftIcon={
                                            <Box
                                                _groupHover={{
                                                    transform: 'scale(1.1)',
                                                }}
                                                transitionDuration="200ms"
                                            >
                                                <Image
                                                    src="/assets/elements/event_ticket_gradient.svg"
                                                    w="4"
                                                    alt="ticket"
                                                />
                                            </Box>
                                        }
                                        _focus={{}}
                                        _active={{}}
                                        onClick={() => {
                                            window.open(eventLink, '_blank')
                                        }}
                                        role="group"
                                    >
                                        Go to event
                                    </Button>
                                </Box>
                                <IconButton
                                    p="1.5px"
                                    mx="auto"
                                    mt="6"
                                    //    bgGradient="linear-gradient(to bottom, #e72c83 0%,#a742c6 100%);"
                                    //    bgClip="text"
                                    icon={
                                        <BsCalendarPlus
                                        // size="40%"
                                        //    color="transparent"
                                        //    fill='transparent'
                                        />
                                    }
                                    role="button"
                                    onClick={() => {
                                        // console.log(moment('20140127T204000Z', "YYYYDDMMThhmmssZ"))
                                        // "02/16/2022--17:10:00-18:00:00"
                                        let eventdate = event.date
                                        let date = eventdate.split('T')[0]
                                        console.log(date)
                                        let startDate = eventdate
                                            .split('T')[1]
                                            .split('-')[0]
                                        console.log(startDate)
                                        let endDate = eventdate
                                            .split('T')[1]
                                            .split('-')[1]
                                        console.log(endDate)
                                        let finalStartDate = moment(
                                            date + ' ' + startDate
                                        ).format()

                                        // console.log(new Date(date+" "+startDate))
                                        console.log(
                                            finalStartDate,
                                            'finalStartDate'
                                        )
                                        let finalEndDate = moment(
                                            date + ' ' + endDate
                                        ).format()
                                        console.log(
                                            finalEndDate,
                                            'finalEndDate'
                                        )
                                        let googleStartDate = toGoogleCalDate(
                                            new Date(finalStartDate)
                                        )
                                        console.log(googleStartDate)
                                        let googleEndDate = toGoogleCalDate(
                                            new Date(finalEndDate)
                                        )
                                        console.log(googleEndDate)
                                        //open a window and redirect to google calendar to add an event with a set date and time in the local time zone format mm/dd/yyyy--hh:mm:ss-hh:mm:ss
                                        window.open(
                                            `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${
                                                event.title
                                            }&dates=${googleStartDate}/${googleEndDate}&details=${
                                                event.description.short_desc
                                            }&location=${decryptLink(
                                                event.link as string
                                            )}&sf=true&output=xml`,
                                            '_blank'
                                        )
                                    }}
                                    aria-label="add to calendar"
                                ></IconButton>
                            </Flex>
                        )}
                    </Flex>
                </Flex>
            </Box>
        </>
    )
}

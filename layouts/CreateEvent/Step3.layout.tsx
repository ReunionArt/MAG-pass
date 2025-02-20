import {
    AspectRatio,
    Box,
    Button,
    Divider,
    Flex,
    FormControl,
    FormLabel,
    Image,
    Input,
    InputGroup,
    InputLeftElement,
    InputRightElement,
    Menu,
    MenuButton,
    MenuDivider,
    MenuItem,
    MenuList,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Select,
    Spinner,
    Switch,
    Text,
    useDisclosure,
    useToast,
} from '@chakra-ui/react'

import '@uiw/react-md-editor/markdown-editor.css'
import '@uiw/react-markdown-preview/markdown.css'
import dynamic from 'next/dynamic'
import { useContext, useState } from 'react'
import { FaTrash, FaYoutube } from 'react-icons/fa'
import Dropzone from 'react-dropzone'
import { HiOutlineChevronRight, HiUpload } from 'react-icons/hi'
import {
    getBuffer,
    getBlob,
    uploadToCloudinary,
    genTicket,
} from '../../utils/imageHelper'

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false })

export default function Step3({
    event,
    onSubmit,
}: {
    onSubmit: Function
    event: any
}) {
    const [formDetails, setFormDetails] = useState<any>({
        slides: [],
        image: '',
        video: '',
    })
    const [image, setImage] = useState<any>(undefined)
    const [loading1, setLoading1] = useState(false)
    const [loading2, setLoading2] = useState(false)
    const [ticket, setTicket] = useState<string>()
    const toast = useToast()
    const { isOpen, onOpen, onClose } = useDisclosure()

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault()
                if (formDetails.image && formDetails.slides.length >= 1) {
                    onSubmit({
                        image: {
                            image: formDetails.image,
                            gallery: [...formDetails.slides, ticket],
                            video: formDetails.video,
                        },
                    })
                } else if (!formDetails.image) {
                    toast({
                        position: 'bottom',

                        duration: 5000,
                        description: "Add your event's cover image",
                        status: 'error',
                    })
                } else {
                    toast({
                        position: 'bottom',

                        duration: 5000,
                        description:
                            'Add atleast 1 images in your event gallery',
                        status: 'error',
                    })
                }
            }}
        >
            <Box color="brand.black">
                <Text
                    align="center"
                    color="brand.black400"
                    fontSize="4xl"
                    fontWeight="semibold"
                    mt="12"
                >
                    Add Image/Video to your event page
                </Text>

                <Flex
                    justify="space-between"
                    experimental_spaceX={{ base: '12', xl: '16' }}
                    mt="6"
                    px="10"
                    maxW="1400px"
                    mx="auto"
                >
                    <Box fontFamily="body" w="full">
                        <FormControl>
                            <FormLabel
                                fontSize={{ base: 'md', xl: 'lg' }}
                                color="blackAlpha.700"
                                my="0"
                            >
                                Ticket Image
                            </FormLabel>
                            <FormLabel
                                fontSize={{ base: 'xs', xl: 'sm' }}
                                color="blackAlpha.500"
                                my="0"
                                mt="1"
                                pb="4"
                            >
                                Add a logo/image for the ticket of your event’s
                                NFT.
                            </FormLabel>
                            {loading1 && (
                                <Box
                                    position="relative"
                                    top="10"
                                    left="15"
                                    zIndex={9}
                                >
                                    <Spinner w="6" h="6" />
                                </Box>
                            )}
                            {ticket ? (
                                <Flex>
                                    <Image
                                        src={ticket}
                                        width="md"
                                        alt="Ticket Image"
                                    />
                                    <Button
                                        onClick={() => {
                                            setTicket(undefined)
                                            formDetails.image = ''
                                        }}
                                        _hover={{
                                            color: 'red.500',
                                        }}
                                    >
                                        <FaTrash size="12px" />
                                    </Button>
                                </Flex>
                            ) : (
                                <AspectRatio ratio={16 / 8} maxW="440px">
                                    <Dropzone
                                        onDrop={async (acceptedFiles) => {
                                            setFormDetails({
                                                ...formDetails,
                                                image: '',
                                            })
                                            setLoading1(true)
                                            let data = await getBuffer(
                                                acceptedFiles[0]
                                            )
                                            let res: string =
                                                await uploadToCloudinary(
                                                    acceptedFiles[0]
                                                )
                                            setFormDetails({
                                                ...formDetails,
                                                image: res,
                                                slides: [...formDetails.slides],
                                            })
                                            let { fastimg } = await genTicket(
                                                event.title,
                                                1,
                                                res,
                                                event.date,
                                                '[your wallet here]'
                                            )
                                            setTicket(fastimg)
                                            onOpen()
                                            setLoading1(false)
                                        }}
                                    >
                                        {({ getRootProps, getInputProps }) => (
                                            <Flex
                                                {...getRootProps()}
                                                w="full"
                                                border="2px"
                                                borderColor="gray.300"
                                                borderStyle="dashed"
                                                rounded="xl"
                                                _hover={{
                                                    borderColor: 'blue.300',
                                                }}
                                                _focus={{
                                                    borderColor: 'blue.300',
                                                }}
                                                experimental_spaceY="4"
                                                direction="column"
                                                align="center"
                                                justify="center"
                                                position="relative"
                                                style={{
                                                    backgroundPosition:
                                                        'center',
                                                    backgroundSize: 'cover',
                                                }}
                                            >
                                                <input
                                                    {...getInputProps()}
                                                    style={{ display: 'none' }}
                                                    accept="image/*"
                                                />
                                                <>
                                                    <Image
                                                        src="/assets/elements/images.svg"
                                                        alt="images"
                                                        w="8"
                                                    />
                                                    <Button
                                                        _hover={{
                                                            bg: 'blackAlpha.50',
                                                        }}
                                                        _focus={{}}
                                                        _active={{}}
                                                        border="2px"
                                                        bg="transparent"
                                                        fontSize="xx-small"
                                                        fontWeight="medium"
                                                        size="xs"
                                                        py="3"
                                                        rounded="md"
                                                        borderColor="blackAlpha.200"
                                                        color="blackAlpha.400"
                                                    >
                                                        Select images
                                                    </Button>
                                                    <Text
                                                        color="blackAlpha.400"
                                                        fontSize="xx-small"
                                                    >
                                                        (Recommended size:
                                                        420x187 | JPG, PNG | Max
                                                        size: 2MB)
                                                    </Text>
                                                </>
                                            </Flex>
                                        )}
                                    </Dropzone>
                                </AspectRatio>
                            )}
                        </FormControl>

                        <FormControl
                            mt="8"
                            _focusWithin={{ borderBottomColor: 'gray.300' }}
                        >
                            <FormLabel
                                fontSize={{ base: 'md', xl: 'lg' }}
                                color="blackAlpha.700"
                                my="0"
                            >
                                Youtube Video (Optional)
                            </FormLabel>
                            <FormLabel
                                fontSize={{ base: 'xs', xl: 'sm' }}
                                color="blackAlpha.500"
                                my="0"
                                mt="1"
                                pb="4"
                            >
                                Add a video about your event. If added, it’ll
                                appear as the first item in the gallery
                            </FormLabel>
                            <InputGroup>
                                <Input
                                    _focus={{
                                        ring: '1px',
                                        ringColor: 'blue.300',
                                        borderColor: 'blue.300',
                                    }}
                                    maxW="500px"
                                    type="url"
                                    onChange={(e) => {
                                        setFormDetails({
                                            ...formDetails,
                                            video: e.target.value,
                                        })
                                    }}
                                    fontSize="sm"
                                    value={formDetails.video}
                                    borderColor="gray.300"
                                    placeholder="Link to video"
                                    bg="transparent"
                                    rounded="full"
                                    _hover={{}}
                                    _active={{}}
                                />
                                <InputLeftElement ml="1" color="gray.400">
                                    <FaYoutube size="20px" />
                                </InputLeftElement>
                            </InputGroup>
                        </FormControl>
                    </Box>

                    <Box minW={{ base: '520px', xl: '700px' }}>
                        <FormControl
                            _focusWithin={{ borderBottomColor: 'gray.300' }}
                        >
                            <FormLabel
                                fontSize={{ base: 'md', xl: 'lg' }}
                                color="blackAlpha.700"
                                my="0"
                            >
                                Gallery
                            </FormLabel>
                            <FormLabel
                                fontSize={{ base: 'xs', xl: 'sm' }}
                                color="blackAlpha.500"
                                my="0"
                                mt="1"
                                pb="4"
                            >
                                Add atleast 2 images to help explain your event
                            </FormLabel>
                            {loading2 && (
                                <Box
                                    position="relative"
                                    top="10"
                                    left="15"
                                    zIndex={9}
                                >
                                    <Spinner w="6" h="6" />
                                </Box>
                            )}
                            <Flex
                                alignItems="end"
                                experimental_spaceX="4"
                                w="full"
                            >
                                <AspectRatio
                                    ratio={16 / 9}
                                    w="full"
                                    rounded="xl"
                                    style={{
                                        backgroundImage: `url(${image})`,
                                        backgroundPosition: 'center',
                                        backgroundSize: 'cover',
                                    }}
                                    overflow="hidden"
                                >
                                    {image ? (
                                        <Dropzone
                                            onDrop={async (acceptedFiles) => {
                                                let files: any = [
                                                    ...formDetails.slides,
                                                ]

                                                acceptedFiles.forEach(
                                                    async (data, key) => {
                                                        setLoading2(true)
                                                        let bytedata =
                                                            await getBuffer(
                                                                data
                                                            )
                                                        let res: string =
                                                            await uploadToCloudinary(
                                                                data
                                                            )
                                                        setFormDetails({
                                                            ...formDetails,
                                                            image: formDetails.image
                                                                ? formDetails.image
                                                                : key == 0
                                                                ? res
                                                                : files[0],
                                                            slides: [
                                                                ...files,
                                                                res,
                                                            ],
                                                        })

                                                        files.push(res)
                                                        setLoading2(false)
                                                    }
                                                )
                                            }}
                                        >
                                            {({
                                                getRootProps,
                                                getInputProps,
                                            }) => (
                                                <Box
                                                    position="relative"
                                                    w="full"
                                                    h="full"
                                                >
                                                    <input
                                                        {...getInputProps()}
                                                        style={{
                                                            display: 'none',
                                                        }}
                                                        accept="image/*"
                                                    />
                                                    <Button
                                                        {...getRootProps()}
                                                        _hover={{ bg: 'white' }}
                                                        _focus={{}}
                                                        _active={{}}
                                                        border="2px"
                                                        position="absolute"
                                                        bottom="2"
                                                        right="2"
                                                        bg="whiteAlpha.900"
                                                        fontWeight="medium"
                                                        size="sm"
                                                        borderColor="whiteAlpha.900"
                                                        color="blackAlpha.900"
                                                        leftIcon={<HiUpload />}
                                                    >
                                                        Upload more images
                                                    </Button>
                                                </Box>
                                            )}
                                        </Dropzone>
                                    ) : (
                                        <Dropzone
                                            onDrop={async (acceptedFiles) => {
                                                let files: any = [
                                                    ...formDetails.slides,
                                                ]
                                                acceptedFiles.forEach(
                                                    async (data, key) => {
                                                        setLoading2(true)
                                                        let bytedata =
                                                            await getBuffer(
                                                                data
                                                            )
                                                        let res: string =
                                                            await uploadToCloudinary(
                                                                data
                                                            )
                                                        setFormDetails({
                                                            ...formDetails,
                                                            image: formDetails.image
                                                                ? formDetails.image
                                                                : key == 0
                                                                ? res
                                                                : files[0],
                                                            slides: [
                                                                ...files,
                                                                res,
                                                            ],
                                                        })
                                                        files.push(res)
                                                        setLoading2(false)
                                                    }
                                                )
                                            }}
                                        >
                                            {({
                                                getRootProps,
                                                getInputProps,
                                            }) => (
                                                <Flex
                                                    {...getRootProps()}
                                                    direction="column"
                                                    align="center"
                                                    justify="center"
                                                    experimental_spaceY="4"
                                                    border="2px"
                                                    borderColor="gray.300"
                                                    borderStyle="dashed"
                                                    rounded="xl"
                                                    _hover={{
                                                        borderColor: 'blue.300',
                                                    }}
                                                    _focus={{
                                                        borderColor: 'blue.300',
                                                    }}
                                                    pb="2"
                                                >
                                                    <input
                                                        {...getInputProps()}
                                                        style={{
                                                            display: 'none',
                                                        }}
                                                        accept="image/*"
                                                    />
                                                    <Image
                                                        src="/assets/elements/images.svg"
                                                        alt="images"
                                                    />
                                                    <Button
                                                        _hover={{
                                                            bg: 'blackAlpha.50',
                                                        }}
                                                        _focus={{}}
                                                        _active={{}}
                                                        border="2px"
                                                        bg="transparent"
                                                        fontSize="sm"
                                                        fontWeight="medium"
                                                        size="sm"
                                                        py="4"
                                                        borderColor="blackAlpha.200"
                                                        color="blackAlpha.300"
                                                    >
                                                        Select images
                                                    </Button>
                                                    <Text
                                                        color="blackAlpha.300"
                                                        fontSize="xs"
                                                    >
                                                        (Recommended size:
                                                        420x187 | JPG, PNG | Max
                                                        size: 2MB)
                                                    </Text>
                                                </Flex>
                                            )}
                                        </Dropzone>
                                    )}
                                </AspectRatio>
                                <Box
                                    maxH={{ base: '210px', xl: '320px' }}
                                    minW={{
                                        md: '100px',
                                        lg: '110px',
                                        xl: '120px',
                                    }}
                                    overflowY="auto"
                                >
                                    <Flex
                                        px="1"
                                        py="1"
                                        direction="column"
                                        minW={{
                                            md: '90px',
                                            lg: '100px',
                                            xl: '110px',
                                        }}
                                        experimental_spaceY="2"
                                    >
                                        {[
                                            formDetails.slides[0]
                                                ? formDetails.slides[0]
                                                : 0,
                                            formDetails.slides[1]
                                                ? formDetails.slides[1]
                                                : 0,
                                            ...formDetails.slides.slice(2),
                                            0,
                                        ].map((data, key) => (
                                            <AspectRatio
                                                key={key}
                                                cursor="pointer"
                                                transitionDuration="100ms"
                                                ratio={16 / 9}
                                                border={data === 0 ? '2px' : ''}
                                                borderColor="gray.300"
                                                borderStyle="dashed"
                                                _hover={{
                                                    borderColor: 'blue.300',
                                                }}
                                                _focus={{
                                                    borderColor: 'blue.300',
                                                }}
                                                w="full"
                                                ringColor="brand.peach"
                                                rounded="md"
                                                style={{
                                                    backgroundImage: `url(${data})`,
                                                    backgroundPosition:
                                                        'center',
                                                    backgroundSize: 'cover',
                                                }}
                                                overflow="hidden"
                                                onClick={() => {
                                                    if (data !== 0) {
                                                        setImage(data)
                                                    }
                                                }}
                                            >
                                                {data !== 0 ? (
                                                    <Box
                                                        position="relative"
                                                        role="group"
                                                    >
                                                        <Box
                                                            color="whiteAlpha.500"
                                                            _hover={{
                                                                color: 'red.500',
                                                            }}
                                                            position="absolute"
                                                            bottom="2"
                                                            right="2"
                                                            onClick={() => {
                                                                let newSlides: any =
                                                                    []
                                                                let k = 0
                                                                formDetails.slides.forEach(
                                                                    (
                                                                        slide: any,
                                                                        index: number
                                                                    ) => {
                                                                        if (
                                                                            slide ===
                                                                            data
                                                                        ) {
                                                                            k =
                                                                                index
                                                                        } else {
                                                                            newSlides.push(
                                                                                slide
                                                                            )
                                                                        }
                                                                    }
                                                                )

                                                                setFormDetails({
                                                                    ...formDetails,
                                                                    slides: newSlides,
                                                                    image:
                                                                        k === 0
                                                                            ? newSlides.length >
                                                                              0
                                                                                ? newSlides[0]
                                                                                : ''
                                                                            : formDetails.image,
                                                                })
                                                                setImage(
                                                                    undefined
                                                                )
                                                            }}
                                                        >
                                                            <FaTrash size="12px" />
                                                        </Box>
                                                    </Box>
                                                ) : (
                                                    <Dropzone
                                                        onDrop={async (
                                                            acceptedFiles
                                                        ) => {
                                                            let files: any = [
                                                                ...formDetails.slides,
                                                            ]

                                                            acceptedFiles.forEach(
                                                                async (
                                                                    data,
                                                                    key
                                                                ) => {
                                                                    setLoading2(
                                                                        true
                                                                    )
                                                                    let bytedata =
                                                                        await getBuffer(
                                                                            data
                                                                        )
                                                                    let res: string =
                                                                        await uploadToCloudinary(
                                                                            data
                                                                        )

                                                                    setFormDetails(
                                                                        {
                                                                            ...formDetails,
                                                                            image: formDetails.image
                                                                                ? formDetails.image
                                                                                : key ==
                                                                                  0
                                                                                ? res
                                                                                : files[0],
                                                                            slides: [
                                                                                ...files,
                                                                                res,
                                                                            ],
                                                                        }
                                                                    )

                                                                    files.push(
                                                                        res
                                                                    )
                                                                    setLoading2(
                                                                        false
                                                                    )
                                                                }
                                                            )
                                                        }}
                                                    >
                                                        {({
                                                            getRootProps,
                                                            getInputProps,
                                                        }) => (
                                                            <Box
                                                                {...getRootProps()}
                                                            >
                                                                <input
                                                                    {...getInputProps()}
                                                                    style={{
                                                                        display:
                                                                            'none',
                                                                    }}
                                                                    accept="image/*"
                                                                />
                                                            </Box>
                                                        )}
                                                    </Dropzone>
                                                )}
                                            </AspectRatio>
                                        ))}
                                    </Flex>
                                </Box>
                            </Flex>
                        </FormControl>
                    </Box>
                </Flex>

                <Flex
                    justifyContent="center"
                    alignItems="center"
                    alignContent="center"
                    mt="10"
                    mb="20"
                >
                    <Button
                        size="lg"
                        rounded="full"
                        type="submit"
                        bg="brand.gradient"
                        color="white"
                        rightIcon={
                            <Flex
                                justify="center"
                                alignItems="center"
                                transitionDuration="200ms"
                                _groupHover={{ transform: 'translateX(4px)' }}
                            >
                                <HiOutlineChevronRight />
                            </Flex>
                        }
                        _hover={{}}
                        _focus={{}}
                        _active={{}}
                        py="7"
                        role="group"
                        fontWeight="medium"
                        px="8"
                    >
                        Next Step
                    </Button>
                </Flex>
            </Box>
        </form>
    )
}

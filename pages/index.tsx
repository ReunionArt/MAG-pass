import { Box } from '@chakra-ui/react'
import type { NextPage } from 'next'
import FeaturedEvents from '../layouts/LandingPage/FeaturedEvents.layout'
import HeroCTA from '../layouts/LandingPage/HeroCTA.layout'
import {
    CategoryType,
    DescriptionType,
    Event,
    ImageType,
} from '../types/Event.type'
import axios from 'axios'
import { gqlEndpoint } from '../utils/subgraphApi'

const Home: NextPage = ({ events }: any) => {
    return (
        <Box h="100vh" overflow="scroll">
            <HeroCTA />
            <Box p={{ md: '2' }} />
            {events ? (
                <FeaturedEvents events={events} />
            ) : (
                <>No Featured Events</>
            )}
        </Box>
    )
}

export default Home

export const getServerSideProps = async () => {
    async function getPolygonFeaturedEvents() {
        const featuredQuery = {
            operationName: 'fetchFeaturedEvents',
            query: `query fetchFeaturedEvents {
              featuredEntities{
                id
                count
                event{
                    id
                    title
                    childAddress
                    category
                    link
                    ticketsBought{
                        id
                    }
                    image
                    buyers{
                        id
                        
                    }
                    eventHost
                    fee
                    venue
                    seats
                    description
                    date
                    }
                }
              
        }`,
        }
        try {
            const res = await axios({
                method: 'POST',
                url: gqlEndpoint,
                data: featuredQuery,
                headers: {
                    'content-type': 'application/json',
                },
            })

            if (!!res.data?.errors?.length) {
                throw new Error('Error fetching featured events')
            }
            return res.data
        } catch (error) {}
    }
    function UnicodeDecodeB64(str: any) {
        return decodeURIComponent(Buffer.from(str, 'base64').toString())
    }
    const parseFeaturedEvents = (featuredEvents: Array<any>): Event[] => {
        if (featuredEvents) {
            return featuredEvents.map((event: { event: any }) => {
                let type = JSON.parse(
                    UnicodeDecodeB64(event.event.category)
                ).event_type
                let category: CategoryType = JSON.parse(
                    UnicodeDecodeB64(event.event.category)
                )
                let image: ImageType = JSON.parse(
                    UnicodeDecodeB64(event.event.image)
                )
                let desc: DescriptionType = JSON.parse(
                    UnicodeDecodeB64(event.event.description)
                )

                // let venue = JSON.parse(UnicodeDecodeB64(event.event.venue))
                console.log(event.event.venue, 'event.venue1')
                return {
                    id: event.event.id,
                    title: event.event.title,
                    childAddress: event.event.childAddress,
                    category: category,
                    image: image,
                    eventHost: event.event.eventHost,
                    fee: Number(event.event.fee) / 10 ** 18,
                    date: event.event.date,
                    description: desc,
                    seats: event.event.seats,
                    owner: event.event.eventHost,
                    link: event.event.link,
                    type: type,
                    venue:
                        event.event.venue !== 'undefined'
                            ? JSON.parse(UnicodeDecodeB64(event.event.venue))
                            : null,
                    tickets_available:
                        event.event.seats - event.event.ticketsBought.length,
                    tickets_sold: event.event.ticketsBought.length,
                    buyers: event.event.buyers,
                    isHuddle: event.event.link.includes('huddle01'),
                    isSolana: false,
                } as Event
            })
        } else {
            return []
        }
    }
    const getSolanaFetauredEvents = async (): Promise<Event[]> => {
        let data: Event[] = []
        const event = await axios.get(
            `${process.env.NEXT_PUBLIC_MONGO_API}/featuredEvents`
        )
        if (event.data) {
            let events = event.data

            events.forEach((event: any) => {
                data.push({
                    ...event,
                    category: JSON.parse(event.category),
                    image: JSON.parse(event.image),
                    description: JSON.parse(event.description),
                    owner: event.eventHost,
                    childAddress: event.eventPDA,
                    isSolana: true,
                })
            })
            return data
        } else {
            console.log('No such document! solana events')
            return []
        }
    }
    const getFeaturedEvents = async () => {
        let allEvents: Event[] = []
        const polygonEvents = await getPolygonFeaturedEvents()
        const polygonData: Event[] = parseFeaturedEvents(
            polygonEvents.data.featuredEntities
        )
        const solanaEvents: Event[] = await getSolanaFetauredEvents()
        allEvents = [...polygonData, ...solanaEvents].reverse()
        return allEvents
    }

    const finalEvents = await getFeaturedEvents()
    return {
        props: { events: finalEvents.length > 0 ? finalEvents : null },
    }
}

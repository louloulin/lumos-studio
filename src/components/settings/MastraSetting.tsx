import { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
    Box,
    Flex,
    FormControl,
    FormLabel,
    Input,
    Select,
    VStack,
} from '@chakra-ui/react'
import { State, useSettingStore } from '@/stores/settings'
import SettingTitle from './SettingTitle'
import Loading from '../Loading'
import { MastraAPI } from '@/api/mastra'

interface Props {
    active: boolean
}

export default function MastraSetting(props: Props) {
    const { t } = useTranslation()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [agents, setAgents] = useState<string[]>([])
    const [isRunning, setIsRunning] = useState(false)

    const { settings, setPartialSettings } = useSettingStore()

    useEffect(() => {
        if (!props.active) return

        const checkServiceAndLoadAgents = async () => {
            setLoading(true)
            setError(null)
            
            try {
                // Check if Mastra service is running
                const serviceRunning = await MastraAPI.isRunning()
                setIsRunning(serviceRunning)
                
                if (serviceRunning) {
                    // Load available agents
                    const availableAgents = await MastraAPI.getAgents()
                    setAgents(availableAgents)
                    
                    // If no agent is selected but agents are available, select the first one
                    if (!settings.mastraAgentName && availableAgents.length > 0) {
                        setPartialSettings({ mastraAgentName: availableAgents[0] })
                    }
                } else {
                    setError('Mastra service is not running. Please start the service.')
                }
            } catch (err) {
                setError('Failed to connect to Mastra service')
                console.error(err)
            } finally {
                setLoading(false)
            }
        }

        checkServiceAndLoadAgents()
    }, [props.active, setPartialSettings, settings.mastraAgentName])

    const handleAgentChange = (e: ChangeEvent<HTMLSelectElement>) => {
        setPartialSettings({ mastraAgentName: e.target.value })
    }

    if (!props.active) return null

    if (loading) {
        return (
            <Flex justify="center" align="center" py={10}>
                <Loading />
            </Flex>
        )
    }

    return (
        <Box>
            <SettingTitle title={t('Mastra Settings')} />
            
            {error && (
                <Box color="red.500" mb={4}>
                    {error}
                </Box>
            )}
            
            {isRunning && (
                <VStack spacing={4} align="stretch">
                    <FormControl>
                        <FormLabel>{t('Select Agent')}</FormLabel>
                        <Select
                            value={settings.mastraAgentName || ''}
                            onChange={handleAgentChange}
                            placeholder={agents.length === 0 ? 'No agents available' : 'Select an agent'}
                            isDisabled={agents.length === 0}
                        >
                            {agents.map(agent => (
                                <option key={agent} value={agent}>
                                    {agent}
                                </option>
                            ))}
                        </Select>
                    </FormControl>
                    
                    <FormControl>
                        <FormLabel>{t('Temperature')}</FormLabel>
                        <Input
                            type="number"
                            min={0}
                            max={2}
                            step={0.1}
                            value={settings.temperature || 0.7}
                            onChange={e => setPartialSettings({ temperature: parseFloat(e.target.value) })}
                        />
                    </FormControl>
                </VStack>
            )}
        </Box>
    )
} 
import { ChangeEvent, useEffect, useState } from 'react'
import { ModelSettings } from '@/shared/types'
import { MastraAPI } from '@/api/mastra'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import MaxContextMessageCountSlider from '@/components/MaxContextMessageCountSlider'
import TemperatureSlider from '@/components/TemperatureSlider'
import { useToast } from '@/hooks/use-toast'

interface MastraSettingProps {
    settingsEdit: ModelSettings
    setSettingsEdit: (settings: ModelSettings) => void
}

export default function MastraSetting(props: MastraSettingProps) {
    const { settingsEdit, setSettingsEdit } = props
    const [loading, setLoading] = useState(false)
    const [agents, setAgents] = useState<string[]>([])
    const [isRunning, setIsRunning] = useState(false)
    const { toast } = useToast()

    useEffect(() => {
        const checkServiceAndLoadAgents = async () => {
            setLoading(true)
            
            try {
                // Check if Mastra service is running
                const serviceRunning = await MastraAPI.isRunning()
                setIsRunning(serviceRunning)
                
                if (serviceRunning) {
                    // Load available agents
                    const availableAgents = await MastraAPI.getAgents()
                    setAgents(availableAgents)
                    
                    // If no agent is selected but agents are available, select the first one
                    if (!settingsEdit.mastraAgentName && availableAgents.length > 0) {
                        setSettingsEdit({ ...settingsEdit, mastraAgentName: availableAgents[0] })
                    }
                } else {
                    toast({
                        title: "Error",
                        description: "Mastra service is not running. Please start the service.",
                        variant: "destructive"
                    })
                }
            } catch (err) {
                toast({
                    title: "Error",
                    description: "Failed to connect to Mastra service",
                    variant: "destructive"
                })
                console.error(err)
            } finally {
                setLoading(false)
            }
        }

        checkServiceAndLoadAgents()
    }, [settingsEdit, setSettingsEdit, toast])

    const handleAgentChange = (value: string) => {
        setSettingsEdit({ ...settingsEdit, mastraAgentName: value })
    }

    return (
        <div className="space-y-4">
            {!isRunning && (
                <div className="text-red-500">
                    Mastra service is not running. Please start the service.
                </div>
            )}
            
            {isRunning && (
                <>
                    <div className="space-y-2">
                        <Label>Select Agent</Label>
                        <Select
                            value={settingsEdit.mastraAgentName || ''}
                            onValueChange={handleAgentChange}
                            disabled={loading || agents.length === 0}
                        >
                            {agents.length === 0 ? (
                                <option value="">No agents available</option>
                            ) : (
                                <>
                                    {agents.map(agent => (
                                        <option key={agent} value={agent}>
                                            {agent}
                                        </option>
                                    ))}
                                </>
                            )}
                        </Select>
                    </div>
                    
                    <TemperatureSlider
                        value={settingsEdit.temperature}
                        onChange={(v) => setSettingsEdit({ ...settingsEdit, temperature: v })}
                    />
                    
                    <MaxContextMessageCountSlider
                        value={settingsEdit.openaiMaxContextMessageCount}
                        onChange={(v) => setSettingsEdit({ ...settingsEdit, openaiMaxContextMessageCount: v })}
                    />
                </>
            )}
        </div>
    )
} 
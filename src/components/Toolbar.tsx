import React, { useState } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import * as atoms from '@/stores/atoms';
import { useTranslation } from 'react-i18next';
import { MoreHorizontal, Eraser } from 'lucide-react';
import StyledMenu from './StyledMenu';
import { Button } from './ui/button';
import { DropdownMenuItem } from './ui/dropdown-menu';

export default function Toolbar() {
    const { t } = useTranslation();
    const currentSession = useAtomValue(atoms.currentSessionAtom);
    const setSessionCleanDialog = useSetAtom(atoms.sessionCleanDialogAtom);

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleMoreMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        event.preventDefault();
        setAnchorEl(event.currentTarget);
    };
    
    const handleMoreMenuClose = () => {
        setAnchorEl(null);
    };
    
    const handleSessionClean = () => {
        setSessionCleanDialog(currentSession);
        handleMoreMenuClose();
    };

    return (
        <div>
            <Button
                variant="ghost"
                size="icon"
                aria-label="more-menu-button"
                onClick={handleMoreMenuOpen}
            >
                <MoreHorizontal className="h-5 w-5" />
            </Button>
            
            <StyledMenu
                anchorEl={anchorEl}
                open={open}
                onClose={handleMoreMenuClose}
            >
                <DropdownMenuItem 
                    onClick={handleSessionClean}
                    className="flex items-center gap-2 text-destructive focus:text-destructive"
                >
                    <Eraser className="h-4 w-4" />
                    <span>{t('Clear All Messages')}</span>
                </DropdownMenuItem>
            </StyledMenu>
        </div>
    );
}

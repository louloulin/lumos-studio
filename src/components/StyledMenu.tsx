import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface StyledMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

const StyledMenu: React.FC<StyledMenuProps> = ({ 
  anchorEl, 
  open, 
  onClose, 
  children,
  className 
}) => {
  // 创建一个trigger ref，这样我们可以通过anchorEl元素定位下拉菜单
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  
  // 当anchorEl改变时，更新trigger元素的位置
  React.useEffect(() => {
    if (anchorEl && triggerRef.current) {
      const rect = anchorEl.getBoundingClientRect();
      triggerRef.current.style.position = 'absolute';
      triggerRef.current.style.left = `${rect.left}px`;
      triggerRef.current.style.top = `${rect.top}px`;
      triggerRef.current.style.width = `${rect.width}px`;
      triggerRef.current.style.height = `${rect.height}px`;
      triggerRef.current.style.opacity = '0';
      triggerRef.current.style.pointerEvents = 'none';
    }
  }, [anchorEl]);
  
  // 不使用anchorEl时，关闭下拉菜单
  React.useEffect(() => {
    if (!anchorEl) {
      onClose();
    }
  }, [anchorEl, onClose]);

  return (
    <DropdownMenu open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DropdownMenuTrigger asChild ref={triggerRef}>
        <button className="w-0 h-0 opacity-0" />
      </DropdownMenuTrigger>
      
      <DropdownMenuContent
        className={cn("min-w-[140px] p-0", className)}
        align="end"
        side="bottom"
        sideOffset={5}
      >
        <DropdownMenuGroup>
          {children}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default StyledMenu;

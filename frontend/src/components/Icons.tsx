import React from 'react';
import { Svg, Path, G, Circle, Line, Polyline } from 'react-native-svg';

// Leaf Icon
export const LeafIcon = ({ size = 40, color = '#B2ECC2' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2Z"
      fill={color}
      opacity="0.3"
    />
    <Path
      d="M12 2C8 2 5 5 5 9C5 13 8 16 12 16C16 16 19 13 19 9C19 5 16 2 12 2Z"
      fill={color}
    />
    <Path
      d="M12 6V18M9 9C10 10 11 11 12 12C13 11 14 10 15 9"
      stroke="#014546"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </Svg>
);

// Tree Icon
export const TreeIcon = ({ size = 100, color = '#61F878' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    {/* Tree foliage */}
    <Circle cx="50" cy="35" r="25" fill={color} />
    <Circle cx="35" cy="45" r="20" fill={color} opacity="0.8" />
    <Circle cx="65" cy="45" r="20" fill={color} opacity="0.8" />
    <Circle cx="50" cy="50" r="22" fill={color} opacity="0.9" />
    
    {/* Tree trunk */}
    <Rect x="45" y="60" width="10" height="25" fill="#8B4513" />
  </Svg>
);

// Location/GPS Icon
export const LocationIcon = ({ size = 16, color = '#B2ECC2' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z"
      fill={color}
    />
    <Circle cx="12" cy="9" r="3" fill="#014546" />
  </Svg>
);

// Target Icon
export const TargetIcon = ({ size = 16, color = '#B2ECC2' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
    <Circle cx="12" cy="12" r="6" stroke={color} strokeWidth="2" />
    <Circle cx="12" cy="12" r="2" fill={color} />
  </Svg>
);

// Calendar Icon
export const CalendarIcon = ({ size = 16, color = '#B2ECC2' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="5" width="18" height="16" rx="2" stroke={color} strokeWidth="2" />
    <Line x1="3" y1="9" x2="21" y2="9" stroke={color} strokeWidth="2" />
    <Line x1="8" y1="3" x2="8" y2="7" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Line x1="16" y1="3" x2="16" y2="7" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

// Alert/Warning Icon
export const AlertIcon = ({ size = 16, color = '#F7C948' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2L1 21H23L12 2Z"
      stroke={color}
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <Line x1="12" y1="9" x2="12" y2="14" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Circle cx="12" cy="17" r="1" fill={color} />
  </Svg>
);

// Folder Icon
export const FolderIcon = ({ size = 60, color = '#B2ECC2' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M2 6C2 4.89543 2.89543 4 4 4H9L11 6H20C21.1046 6 22 6.89543 22 8V18C22 19.1046 21.1046 20 20 20H4C2.89543 20 2 19.1046 2 18V6Z"
      fill={color}
    />
    <Path
      d="M2 10H22V18C22 19.1046 21.1046 20 20 20H4C2.89543 20 2 19.1046 2 18V10Z"
      fill={color}
      opacity="0.7"
    />
  </Svg>
);

// Menu Icon (hamburger)
export const MenuIcon = ({ size = 24, color = '#FFFFFF' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1="3" y1="6" x2="21" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Line x1="3" y1="12" x2="21" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Line x1="3" y1="18" x2="21" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

// Camera Icon
export const CameraIcon = ({ size = 32, color = '#012626' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 3H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z"
      fill={color}
    />
    <Circle cx="12" cy="14" r="4" fill="#FFFFFF" />
  </Svg>
);

// Close/X Icon
export const CloseIcon = ({ size = 24, color = '#FFFFFF' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1="18" y1="6" x2="6" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Line x1="6" y1="6" x2="18" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);
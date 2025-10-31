
'use client';
import { Star, IndianRupee, Palette } from 'lucide-react';
import React from 'react';

export interface PromoImageTemplateProps {
  workImages: string[];
  artistName: string;
  artistServices: string;
  artistRating: number;
  baseCharge: number;
  artistProfilePic?: string;
}

export const PromoImageTemplate: React.FC<PromoImageTemplateProps> = ({
  workImages = [],
  artistName,
  artistServices,
  artistRating,
  baseCharge,
  artistProfilePic
}) => {
  // Define positions for a 4-image collage
  const imagePositions = [
    { top: '5%', left: '5%', width: '45%', height: '55%', transform: 'rotate(-3deg)' },
    { top: '10%', left: '50%', width: '45%', height: '40%', transform: 'rotate(2deg)' },
    { top: '45%', left: '40%', width: '55%', height: '50%', transform: 'rotate(-1deg)' },
    { top: '65%', left: '5%', width: '30%', height: '30%', transform: 'rotate(4deg)' },
  ];

  return (
    <div
      style={{
        width: 1080,
        height: 1350,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '"Roboto", sans-serif',
        background: 'hsl(var(--brand-rich-henna))',
        position: 'relative',
        color: '#8B4513',
        overflow: 'hidden',
      }}
    >
      {/* Image Collage Section */}
       <div style={{
            width: '100%',
            height: '75%',
            position: 'relative',
            background: 'radial-gradient(circle, hsl(40 55% 95%) 0%, hsl(25 75% 40%) 100%)'
       }}>
            {workImages.map((src, index) => (
                <div
                key={index}
                style={{
                    position: 'absolute',
                    ...imagePositions[index],
                    boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
                    borderRadius: '12px',
                    border: '8px solid white',
                    overflow: 'hidden',
                }}
                >
                <img
                    src={src}
                    crossOrigin="anonymous"
                    style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    }}
                    alt={`Collage image ${index + 1}`}
                />
                </div>
            ))}
       </div>


      {/* Bottom Information Panel */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '20px 40px',
          width: '100%',
          height: '25%',
          position: 'relative',
          zIndex: 3,
          boxSizing: 'border-box',
          backgroundColor: 'hsl(var(--brand-soft-sand))',
          borderTop: '4px solid hsl(var(--brand-golden-bronze))'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {/* Left Side: Artist Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    {artistProfilePic && (
                        <img
                            src={artistProfilePic}
                            crossOrigin="anonymous"
                            style={{
                            width: '100px',
                            height: '100px',
                            objectFit: 'cover',
                            borderRadius: '50%',
                            border: '6px solid white',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                            flexShrink: 0
                            }}
                            alt={artistName}
                        />
                    )}
                    <div>
                        <h2 style={{ fontFamily: '"Roboto", sans-serif', fontSize: '48px', fontWeight: 'bold', margin: 0, lineHeight: 1.2, color: 'hsl(var(--primary))' }}>
                            {artistName}
                        </h2>
                        <p style={{ fontSize: '24px', color: '#CD7F32', margin: '4px 0 0 0', fontWeight: '500' }}>
                            {artistServices}
                        </p>
                    </div>
                </div>

                 {/* Right Side: UtsavLook Branding & Price */}
                 <div style={{textAlign: 'right'}}>
                    <div style={{fontFamily: '"Playfair Display", serif', fontSize: '48px', fontWeight: 'bold' }}>
                        <span style={{color: 'hsl(var(--accent))'}}>Utsav</span>
                        <span style={{color: 'hsl(var(--primary))'}}>Look</span>
                    </div>
                     <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '16px', marginTop: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Star style={{ width: '28px', height: '28px', color: '#CD7F32', fill: '#CD7F32' }} />
                            <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#8B4513' }}>{artistRating.toFixed(1)}</span>
                        </div>
                        <div style={{ fontSize: '22px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            Starts from
                            <span style={{ fontWeight: 'bold', fontSize: '28px', display: 'flex', alignItems: 'center'}}>
                                <IndianRupee style={{ width: '22px', height: '22px' }} />{baseCharge.toLocaleString()}
                            </span>
                        </div>
                    </div>
                 </div>
            </div>
        </div>
    </div>
  );
};

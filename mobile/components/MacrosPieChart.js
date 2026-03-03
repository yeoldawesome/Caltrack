import React from 'react';
import { View, Text } from 'react-native';
import { Svg, G, Circle } from 'react-native-svg';

// expects protein, carbs, fat in grams
// calculates calories and draws proportionate pie segments
export default function MacrosPieChart({ protein = 0, carbs = 0, fat = 0, size = 120, strokeWidth = 20 }) {
  const proteinCal = protein * 4;
  const carbsCal = carbs * 4;
  const fatCal = fat * 9;
  const total = proteinCal + carbsCal + fatCal;
  const pPerc = total ? proteinCal / total : 0;
  const cPerc = total ? carbsCal / total : 0;
  const fPerc = total ? fatCal / total : 0;

  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // colors for segments
  const pColor = '#4fd1c5'; // protein cyan
  const cColor = '#f6e05e'; // carbs yellow
  const fColor = '#f56565'; // fat red

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${center},${center}`}>  
          {/* protein */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={pColor}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference * pPerc} ${circumference}`}
            fill="none"
          />
          {/* carbs */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={cColor}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference * cPerc} ${circumference}`}
            strokeDashoffset={circumference * pPerc}
            fill="none"
          />
          {/* fat */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={fColor}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference * fPerc} ${circumference}`}
            strokeDashoffset={circumference * (pPerc + cPerc)}
            fill="none"
          />
        </G>
      </Svg>
      {total > 0 && (
        <View style={{ position: 'absolute', alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>{Math.round(total)} kcal</Text>
        </View>
      )}
    </View>
  );
}

export function MacrosPieChartWithLabels({ protein = 0, carbs = 0, fat = 0, size = 140, strokeWidth = 16 }) {
  const proteinCal = protein * 4;
  const carbsCal = carbs * 4;
  const fatCal = fat * 9;
  const total = proteinCal + carbsCal + fatCal;
  const pPerc = total ? proteinCal / total : 0;
  const cPerc = total ? carbsCal / total : 0;
  const fPerc = total ? fatCal / total : 0;

  const pColor = '#4fd1c5'; // protein cyan
  const cColor = '#f6e05e'; // carbs yellow
  const fColor = '#f56565'; // fat red

  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <Svg width={size} height={size}>
          <G rotation="-90" origin={`${center},${center}`}>
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke={pColor}
              strokeWidth={strokeWidth}
              strokeDasharray={`${circumference * pPerc} ${circumference}`}
              fill="none"
            />
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke={cColor}
              strokeWidth={strokeWidth}
              strokeDasharray={`${circumference * cPerc} ${circumference}`}
              strokeDashoffset={circumference * pPerc}
              fill="none"
            />
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke={fColor}
              strokeWidth={strokeWidth}
              strokeDasharray={`${circumference * fPerc} ${circumference}`}
              strokeDashoffset={circumference * (pPerc + cPerc)}
              fill="none"
            />
          </G>
        </Svg>
        {total > 0 && (
          <View style={{ position: 'absolute', alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>{Math.round(total)}</Text>
            <Text style={{ color: '#7b848b', fontSize: 11 }}>kcal</Text>
          </View>
        )}
      </View>

      {/* Labels */}
      {total > 0 && (
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 12, height: 12, backgroundColor: pColor, borderRadius: 2 }} />
            <Text style={{ color: '#f5f6fa', fontSize: 12 }}>
              Protein: {protein}g ({Math.round(pPerc * 100)}%)
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 12, height: 12, backgroundColor: cColor, borderRadius: 2 }} />
            <Text style={{ color: '#f5f6fa', fontSize: 12 }}>
              Carbs: {carbs}g ({Math.round(cPerc * 100)}%)
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 12, height: 12, backgroundColor: fColor, borderRadius: 2 }} />
            <Text style={{ color: '#f5f6fa', fontSize: 12 }}>
              Fat: {fat}g ({Math.round(fPerc * 100)}%)
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

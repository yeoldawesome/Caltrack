import React from 'react';
import { View, Text } from 'react-native';
import { Svg, G, Circle } from 'react-native-svg';

// expects protein, carbs, fat in grams and optionally totalCalories for full circle
// when totalCalories is provided, the remainder after macros is treated as "unknown" segment
export default function MacrosPieChart({ protein = 0, carbs = 0, fat = 0, totalCalories = null, size = 120, strokeWidth = 20 }) {
  const proteinCal = protein * 4;
  const carbsCal = carbs * 4;
  const fatCal = fat * 9;
  // determine base total for calculating percentages
  const baseTotal = totalCalories && totalCalories > 0 ? totalCalories : proteinCal + carbsCal + fatCal;
  const macroSum = proteinCal + carbsCal + fatCal;
  const unknownCal = Math.max(0, baseTotal - macroSum);
  const pPerc = baseTotal ? proteinCal / baseTotal : 0;
  const cPerc = baseTotal ? carbsCal / baseTotal : 0;
  const fPerc = baseTotal ? fatCal / baseTotal : 0;
  const uPerc = baseTotal ? unknownCal / baseTotal : 0;

  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // colors for segments (brightened for visibility)
  const pColor = '#4fd1c5'; // protein cyan
  const cColor = '#f6d859'; // carbs yellow (brighter)
  const fColor = '#ff6b6b'; // fat red (brighter)
  const uColor = '#94a3b8'; // unknown grey

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${center},${center}`}>
          {/* background full ring to avoid gaps */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={'#0f1720'}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* protein */}
          {/* use rounded caps for nicer contiguous segments */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={pColor}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference * pPerc} ${circumference}`}
            strokeLinecap="round"
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
            strokeLinecap="round"
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
            strokeLinecap="round"
            fill="none"
          />
          {/* unknown remainder */}
          {uPerc > 0 && (
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke={uColor}
              strokeWidth={strokeWidth}
              strokeDasharray={`${circumference * uPerc} ${circumference}`}
              strokeDashoffset={circumference * (pPerc + cPerc + fPerc)}
              strokeLinecap="round"
              fill="none"
            />
          )}
        </G>
      </Svg>
      {baseTotal > 0 && (
        <View style={{ position: 'absolute', alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>{Math.round(baseTotal)} kcal</Text>
        </View>
      )}
    </View>
  );
}

export function MacrosPieChartWithLabels({ protein = 0, carbs = 0, fat = 0, totalCalories = null, size = 140, strokeWidth = 16 }) {
  const proteinCal = protein * 4;
  const carbsCal = carbs * 4;
  const fatCal = fat * 9;
  const baseTotal = totalCalories && totalCalories > 0 ? totalCalories : proteinCal + carbsCal + fatCal;
  const macroSum = proteinCal + carbsCal + fatCal;
  const unknownCal = Math.max(0, baseTotal - macroSum);
  const pPerc = baseTotal ? proteinCal / baseTotal : 0;
  const cPerc = baseTotal ? carbsCal / baseTotal : 0;
  const fPerc = baseTotal ? fatCal / baseTotal : 0;
  const uPerc = baseTotal ? unknownCal / baseTotal : 0;

  const pColor = '#4fd1c5'; // protein cyan
  const cColor = '#f6e05e'; // carbs yellow
  const fColor = '#f56565'; // fat red
  const uColor = '#718096'; // unknown grey

  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
        <Svg width={size} height={size}>
          <G rotation="-90" origin={`${center},${center}`}>
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke={'#0f1720'}
              strokeWidth={strokeWidth}
              fill="none"
            />
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke={pColor}
              strokeWidth={strokeWidth}
              strokeDasharray={`${circumference * pPerc} ${circumference}`}
              strokeLinecap="butt"
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
              strokeLinecap="butt"
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
              strokeLinecap="butt"
              fill="none"
            />
            {uPerc > 0 && (
              <Circle
                cx={center}
                cy={center}
                r={radius}
                stroke={uColor}
                strokeWidth={strokeWidth}
                strokeDasharray={`${circumference * uPerc} ${circumference}`}
                strokeDashoffset={circumference * (pPerc + cPerc + fPerc)}
                strokeLinecap="butt"
                fill="none"
              />
            )}
          </G>
        </Svg>
        {baseTotal > 0 && (
          <View style={{ position: 'absolute', alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>{Math.round(baseTotal)}</Text>
            <Text style={{ color: '#7b848b', fontSize: 11 }}>kcal</Text>
          </View>
        )}
      </View>

      {/* Labels to the right of the chart, kcal primary */}
      {baseTotal > 0 && (
        <View style={{ justifyContent: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <View style={{ width: 14, height: 14, backgroundColor: pColor, borderRadius: 4, marginRight: 10 }} />
            <Text style={{ color: '#f5f6fa', fontSize: 14, fontWeight: '600' }}>Protein</Text>
            <Text style={{ color: '#7b848b', fontSize: 13, marginLeft: 10 }}>{Math.round(proteinCal)} kcal</Text>
            <Text style={{ color: '#7b848b', fontSize: 12, marginLeft: 8 }}>({protein}g)</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <View style={{ width: 14, height: 14, backgroundColor: cColor, borderRadius: 4, marginRight: 10 }} />
            <Text style={{ color: '#f5f6fa', fontSize: 14, fontWeight: '600' }}>Carbs</Text>
            <Text style={{ color: '#7b848b', fontSize: 13, marginLeft: 10 }}>{Math.round(carbsCal)} kcal</Text>
            <Text style={{ color: '#7b848b', fontSize: 12, marginLeft: 8 }}>({carbs}g)</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <View style={{ width: 14, height: 14, backgroundColor: fColor, borderRadius: 4, marginRight: 10 }} />
            <Text style={{ color: '#f5f6fa', fontSize: 14, fontWeight: '600' }}>Fat</Text>
            <Text style={{ color: '#7b848b', fontSize: 13, marginLeft: 10 }}>{Math.round(fatCal)} kcal</Text>
            <Text style={{ color: '#7b848b', fontSize: 12, marginLeft: 8 }}>({fat}g)</Text>
          </View>

          {uPerc > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 14, height: 14, backgroundColor: uColor, borderRadius: 4, marginRight: 10 }} />
              <Text style={{ color: '#f5f6fa', fontSize: 14, fontWeight: '600' }}>Other</Text>
              <Text style={{ color: '#7b848b', fontSize: 13, marginLeft: 10 }}>{Math.round(unknownCal)} kcal</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

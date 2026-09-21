import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import Svg, { Circle, Line, Path, Polygon } from 'react-native-svg';

const BEST_KEY = 'muhyoujou_dash_best_v1';
const PLAYER_X = 74;
const PLAYER_W = 62;
const PLAYER_H = 48;
const GRAVITY = 1680;
const JUMP_POWER = 650;
const between = (min, max) => min + Math.random() * (max - min);

function Dinosaur({ running, airborne, size = 1 }) {
  const flip = running && Date.now() % 240 < 120;
  return (
    <Svg width={72 * size} height={56 * size} viewBox="0 0 72 56">
      <Path
        d="M9 30 C4 24 3 17 8 10 C9 17 14 21 21 22 C25 12 34 7 48 8 C58 9 64 15 63 23 C62 29 57 32 50 33 L48 39 L23 39 C18 37 13 34 9 30 Z"
        fill="#f8f7f2" stroke="#171717" strokeWidth="2.5" strokeLinejoin="round"
      />
      <Circle cx="53" cy="18" r="1.6" fill="#171717" />
      <Line x1="57" y1="24" x2="63" y2="24" stroke="#171717" strokeWidth="1.7" />
      <Path d="M23 38 L20 50 L14 51" fill="none" stroke="#171717" strokeWidth="3" strokeLinecap="round" />
      <Path d="M42 38 L45 50 L52 51" fill="none" stroke="#171717" strokeWidth="3" strokeLinecap="round" />
      {!airborne && <>
        <Line x1={flip ? 19 : 16} y1="51" x2={flip ? 12 : 22} y2="52" stroke="#171717" strokeWidth="2.4" strokeLinecap="round" />
        <Line x1={flip ? 53 : 49} y1="51" x2={flip ? 58 : 43} y2="52" stroke="#171717" strokeWidth="2.4" strokeLinecap="round" />
      </>}
      <Path d="M31 23 L37 27 L31 28" fill="none" stroke="#171717" strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function Cloud({ left, top, scale = 1 }) {
  return <View style={[styles.cloud, { left, top, transform: [{ scale }] }]}>
    <View style={[styles.cloudPuff, { left: 7, top: 10, width: 33, height: 17 }]} />
    <View style={[styles.cloudPuff, { left: 22, top: 1, width: 24, height: 24 }]} />
    <View style={[styles.cloudPuff, { left: 37, top: 9, width: 29, height: 18 }]} />
  </View>;
}

function Rock({ width, height }) {
  return <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
    <Polygon points={`2,${height - 2} ${width * .18},${height * .46} ${width * .43},${height * .18} ${width * .72},${height * .3} ${width - 2},${height - 2}`} fill="#dedbd2" stroke="#222" strokeWidth="2.5" strokeLinejoin="round" />
    <Path d={`M${width * .42} ${height * .22} L${width * .48} ${height * .58}`} stroke="#99958b" strokeWidth="1.5" />
  </Svg>;
}

function River({ width }) {
  return <Svg width={width} height="18" viewBox={`0 0 ${width} 18`}>
    <Path d={`M0 6 C14 1 22 13 36 7 S58 1 72 7 S94 13 ${width} 6`} fill="none" stroke="#2f78a8" strokeWidth="2" strokeLinecap="round" />
    <Path d={`M5 13 C20 7 30 16 45 11 S70 7 86 11 S100 15 ${width} 10`} fill="none" stroke="#5b9bc5" strokeWidth="1.5" />
  </Svg>;
}

function Tuft({ left, baseline }) {
  return <Svg style={{ position: 'absolute', left, top: baseline - 19 }} width="26" height="20" viewBox="0 0 26 20">
    <Path d="M13 19 C11 11 8 6 4 3 M13 19 C13 10 15 5 18 1 M13 19 C17 12 20 9 24 8" fill="none" stroke="#69665e" strokeWidth="1.6" strokeLinecap="round" />
  </Svg>;
}

function GameObject({ item, baseline }) {
  const pos = { position: 'absolute', left: item.x };
  if (item.type === 'rock') return <View style={[pos, { top: baseline - item.height }]}><Rock width={item.width} height={item.height} /></View>;
  if (item.type === 'river') return <View style={[pos, { top: baseline - 3, width: item.width, height: 20, overflow: 'hidden' }]}><River width={item.width} /></View>;
  if (item.type === 'pit') return <View style={[pos, { top: baseline - 2, width: item.width, height: 50 }]}><View style={styles.pitMouth} /><Text style={styles.pitText}>・・・・</Text></View>;
  if (item.type === 'slope') return <View style={[pos, styles.slope, { top: baseline - 22, width: item.width, transform: [{ rotate: item.direction > 0 ? '-8deg' : '8deg' }] }]} />;
  if (item.type === 'cliff') return <View style={[pos, { top: baseline - 28, width: item.width, height: 52 }]}><View style={styles.cliffTop} /><Svg width={item.width} height="50"><Path d={`M2 0 L2 46 M${item.width - 2} 0 L${item.width - 8} 48`} stroke="#292929" strokeWidth="2" /></Svg></View>;
  return null;
}

function StartScreen({ best, onStart }) {
  return <SafeAreaView style={styles.startScreen}>
    <StatusBar style="dark" />
    <View style={styles.titleDino}><Dinosaur running={false} airborne={false} size={1.45} /></View>
    <Text style={styles.title}>無表情ダッシュ</Text>
    <Text style={styles.subtitle}>顔はそのまま。足だけ急げ。</Text>
    <Pressable style={({ pressed }) => [styles.startButton, pressed && styles.buttonPressed]} onPress={onStart}><Text style={styles.startButtonText}>走る</Text></Pressable>
    <Text style={styles.howTo}>タップでジャンプ　・　2回タップで2段ジャンプ</Text>
    <Text style={styles.bestStart}>BEST {String(best).padStart(5, '0')} m</Text>
  </SafeAreaView>;
}

export default function App() {
  const { width, height } = useWindowDimensions();
  const baseline = Math.max(250, height * .72);
  const [mode, setMode] = useState('start');
  const [best, setBest] = useState(0);
  const [frame, setFrame] = useState({ altitude: 0, objects: [], distance: 0, speed: 235, jumps: 0 });
  const stateRef = useRef({ altitude: 0, velocity: 0, objects: [], distance: 0, speed: 235, jumps: 0, spawnIn: 330, lastTime: 0, alive: false });
  const rafRef = useRef(null);

  useEffect(() => {
    AsyncStorage.getItem(BEST_KEY).then((value) => value && setBest(Number(value) || 0));
    return () => rafRef.current && cancelAnimationFrame(rafRef.current);
  }, []);

  const endGame = useCallback(() => {
    const score = Math.floor(stateRef.current.distance);
    stateRef.current.alive = false;
    setMode('over');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    setBest((old) => {
      const next = Math.max(old, score);
      AsyncStorage.setItem(BEST_KEY, String(next)).catch(() => {});
      return next;
    });
  }, []);

  const spawn = useCallback((screenWidth) => {
    const roll = Math.random();
    let item;
    if (roll < .38) item = { type: 'rock', width: between(35, 58), height: between(30, 53) };
    else if (roll < .59) item = { type: 'river', width: between(82, 125), height: 8 };
    else if (roll < .75) item = { type: 'pit', width: between(70, 105), height: 10 };
    else if (roll < .91) item = { type: 'slope', width: between(125, 180), height: 20, direction: Math.random() > .5 ? 1 : -1 };
    else item = { type: 'cliff', width: between(75, 105), height: 28 };
    return { ...item, id: `${Date.now()}-${Math.random()}`, x: screenWidth + 60 };
  }, []);

  const tick = useCallback((now) => {
    const s = stateRef.current;
    if (!s.alive) return;
    if (!s.lastTime) s.lastTime = now;
    const dt = Math.min((now - s.lastTime) / 1000, .033);
    s.lastTime = now;
    s.speed = Math.min(520, 235 + s.distance * .085);
    s.distance += dt * s.speed * .055;
    s.spawnIn -= s.speed * dt;
    if (s.spawnIn <= 0) {
      s.objects.push(spawn(width));
      s.spawnIn = between(250, 430) + s.speed * .18;
    }
    s.objects.forEach((item) => { item.x -= s.speed * dt; });
    s.objects = s.objects.filter((item) => item.x + item.width > -30);
    s.velocity -= GRAVITY * dt;
    s.altitude += s.velocity * dt;
    if (s.altitude <= 0) { s.altitude = 0; s.velocity = 0; s.jumps = 0; }

    const left = PLAYER_X + 9;
    const right = PLAYER_X + PLAYER_W - 7;
    const hit = s.objects.some((item) => {
      const overlap = right > item.x + 5 && left < item.x + item.width - 5;
      if (!overlap || item.type === 'slope') return false;
      if (item.type === 'rock') return s.altitude < item.height - 7;
      if (item.type === 'river' || item.type === 'pit') return s.altitude < 18;
      if (item.type === 'cliff') return s.altitude < item.height - 2;
      return false;
    });
    if (hit) return endGame();
    setFrame({ altitude: s.altitude, objects: [...s.objects], distance: s.distance, speed: s.speed, jumps: s.jumps });
    rafRef.current = requestAnimationFrame(tick);
  }, [endGame, spawn, width]);

  const startGame = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    stateRef.current = { altitude: 0, velocity: 0, objects: [], distance: 0, speed: 235, jumps: 0, spawnIn: Math.max(260, width * .62), lastTime: 0, alive: true };
    setFrame({ altitude: 0, objects: [], distance: 0, speed: 235, jumps: 0 });
    setMode('playing');
    rafRef.current = requestAnimationFrame(tick);
  }, [tick, width]);

  const jump = useCallback(() => {
    const s = stateRef.current;
    if (!s.alive || s.jumps >= 2) return;
    s.velocity = s.jumps === 0 ? JUMP_POWER : JUMP_POWER * .84;
    s.jumps += 1;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, []);

  if (mode === 'start') return <StartScreen best={best} onStart={startGame} />;
  const distance = Math.floor(frame.distance);
  const grassOffset = -((frame.distance * 7) % 46);
  return <Pressable style={styles.game} onPress={mode === 'playing' ? jump : undefined}>
    <StatusBar style="dark" hidden={height < 500} />
    <Cloud left={width * .18 - ((frame.distance * .4) % (width + 100))} top={height * .14} scale={.85} />
    <Cloud left={width * .68 - ((frame.distance * .22) % (width + 160))} top={height * .23} scale={1.2} />
    <View style={styles.scoreBox} pointerEvents="none"><Text style={styles.score}>{String(distance).padStart(5, '0')} m</Text><Text style={styles.speed}>速度 {Math.round(frame.speed * .12)} km/h</Text></View>
    <View style={[styles.groundLine, { top: baseline }]} />
    {Array.from({ length: Math.ceil(width / 46) + 3 }).map((_, i) => <Tuft key={i} left={grassOffset + i * 46} baseline={baseline} />)}
    {frame.objects.map((item) => <GameObject key={item.id} item={item} baseline={baseline} />)}
    <View style={[styles.player, { left: PLAYER_X, top: baseline - PLAYER_H - frame.altitude + (frame.altitude === 0 ? Math.sin(frame.distance * .9) * 1.4 : 0) }]} pointerEvents="none"><Dinosaur running={mode === 'playing'} airborne={frame.altitude > 3} /></View>
    {mode === 'playing' && <View style={styles.tapHint} pointerEvents="none"><Text style={styles.tapHintText}>{frame.jumps === 1 ? 'もう1回で 2段ジャンプ' : 'TAP'}</Text></View>}
    {mode === 'over' && <View style={styles.overlay}><View style={styles.gameOverCard}>
      <Text style={styles.gameOverSmall}>ぶつかった。</Text><Text style={styles.gameOverTitle}>無表情。</Text>
      <View style={styles.resultRow}><Text style={styles.resultLabel}>きろく</Text><Text style={styles.resultValue}>{distance} m</Text></View>
      <View style={styles.resultRow}><Text style={styles.resultLabel}>ベスト</Text><Text style={styles.resultValue}>{Math.max(best, distance)} m</Text></View>
      <Pressable style={({ pressed }) => [styles.retryButton, pressed && styles.buttonPressed]} onPress={startGame}><Text style={styles.retryText}>もう一度</Text></Pressable>
      <Pressable onPress={() => setMode('start')} hitSlop={12}><Text style={styles.backText}>タイトルへ</Text></Pressable>
    </View></View>}
  </Pressable>;
}

const styles = StyleSheet.create({
  startScreen: { flex: 1, backgroundColor: '#f8f7f2', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  titleDino: { marginBottom: 8, transform: [{ rotate: '-2deg' }] },
  title: { fontSize: 42, fontWeight: '900', color: '#161616', letterSpacing: 2 },
  subtitle: { marginTop: 8, fontSize: 15, color: '#5f5b54', letterSpacing: 1.5 },
  startButton: { marginTop: 42, width: 156, height: 58, borderRadius: 4, borderWidth: 2.5, borderColor: '#171717', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-1deg' }], shadowColor: '#111', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0 },
  buttonPressed: { transform: [{ translateX: 3 }, { translateY: 3 }], shadowOpacity: 0 },
  startButtonText: { fontSize: 23, fontWeight: '800', color: '#181818' },
  howTo: { marginTop: 32, color: '#6b675f', fontSize: 12, textAlign: 'center' },
  bestStart: { marginTop: 13, fontSize: 13, fontWeight: '800', letterSpacing: 2, color: '#292929' },
  game: { flex: 1, backgroundColor: '#f8f7f2', overflow: 'hidden' },
  cloud: { position: 'absolute', width: 72, height: 34, opacity: .65 },
  cloudPuff: { position: 'absolute', borderRadius: 20, borderWidth: 1.7, borderColor: '#77736b', backgroundColor: '#f8f7f2' },
  scoreBox: { position: 'absolute', zIndex: 10, top: 28, right: 24, alignItems: 'flex-end' },
  score: { fontSize: 25, fontWeight: '900', color: '#202020', letterSpacing: 2 },
  speed: { marginTop: 2, fontSize: 10, color: '#716d65', letterSpacing: 1 },
  groundLine: { position: 'absolute', left: 0, right: 0, height: 2, backgroundColor: '#282828' },
  player: { position: 'absolute', width: 72, height: 56, zIndex: 6 },
  pitMouth: { height: 7, backgroundColor: '#171717', borderRadius: 50, transform: [{ scaleY: .5 }] },
  pitText: { marginTop: -7, color: '#777', fontSize: 13, textAlign: 'center', letterSpacing: 6 },
  slope: { position: 'absolute', height: 3, backgroundColor: '#272727' },
  cliffTop: { height: 3, backgroundColor: '#272727' },
  tapHint: { position: 'absolute', left: 0, right: 0, bottom: 24, alignItems: 'center' },
  tapHintText: { color: '#a09b91', fontSize: 11, fontWeight: '700', letterSpacing: 2 },
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 20, backgroundColor: 'rgba(248,247,242,.83)', alignItems: 'center', justifyContent: 'center' },
  gameOverCard: { width: 270, paddingVertical: 26, paddingHorizontal: 30, backgroundColor: '#f8f7f2', borderWidth: 2.5, borderColor: '#171717', transform: [{ rotate: '.7deg' }], alignItems: 'center' },
  gameOverSmall: { fontSize: 13, color: '#77736b' },
  gameOverTitle: { marginTop: 2, marginBottom: 19, fontSize: 33, fontWeight: '900', color: '#151515' },
  resultRow: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 },
  resultLabel: { color: '#67635c', fontSize: 13 }, resultValue: { color: '#181818', fontWeight: '800', fontSize: 15 },
  retryButton: { marginTop: 24, width: 150, height: 48, borderWidth: 2, borderColor: '#171717', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#111', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0 },
  retryText: { fontSize: 17, fontWeight: '800', color: '#171717' },
  backText: { marginTop: 18, color: '#706c64', fontSize: 12, textDecorationLine: 'underline' },
});

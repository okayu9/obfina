export interface LoadingRing {
	className: string;
	radius: number;
}

export interface LoadingNode {
	role: 'guard' | 'middle' | 'exit';
	x: number;
	y: number;
	radius: number;
}

export interface LoadingEdge {
	className: string;
	x1: number;
	y1: number;
	x2: number;
	y2: number;
}

export interface LoadingBar {
	height: string;
	delay: string;
}

export const LOADING_CENTER = 60;

export const LOADING_RINGS: LoadingRing[] = [
	{ className: 'ring-1', radius: 46 },
	{ className: 'ring-2', radius: 30 }
];

export const LOADING_NODES: LoadingNode[] = [
	{ role: 'guard', x: 60, y: 14, radius: 5 },
	{ role: 'middle', x: 99.9, y: 83, radius: 4 },
	{ role: 'exit', x: 20.1, y: 83, radius: 4 }
];

export const LOADING_EDGES: LoadingEdge[] = [
	{ className: 'a', x1: 60, y1: 14, x2: 99.9, y2: 83 },
	{ className: 'b', x1: 99.9, y1: 83, x2: 20.1, y2: 83 },
	{ className: 'c', x1: 20.1, y1: 83, x2: 60, y2: 14 }
];

export const LOADING_PACKET_PATH = 'M60,14 L99.9,83 L20.1,83 Z';

export const LOADING_BARS: LoadingBar[] = [
	{ height: '30%', delay: '0s' },
	{ height: '70%', delay: '0.15s' },
	{ height: '50%', delay: '0.3s' },
	{ height: '90%', delay: '0.45s' },
	{ height: '40%', delay: '0.6s' }
];

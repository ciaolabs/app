import { type InventoryCode, type ScaleDefinition } from "@/lib/survey/results/types";

const INVENTORY_CODE_BY_LABEL: Record<string, InventoryCode> = {
  "NEO PI-R": "NEO",
  "HEXACO-PI": "HEXACO",
  MPQ: "MPQ",
  CPI: "CPI",
  "JPI-R": "JPIR",
  "6-FPQ": "6FPQ",
  TCI: "TCI",
  HPI: "HPI",
};

const RAW_AMBI_SCORING_ROWS = `
1 | NEO PI-R | Anxiety | 1R, 71, 162, 147, 33 | 0.75 | 0.67 | 0.83
2 | NEO PI-R | Angry Hostility | 123, 33, 62R, 24, 60 | 0.69 | 0.68 | 0.80
3 | NEO PI-R | Depression | 57, 33, 160, 72, 1R | 0.72 | 0.65 | 0.85
4 | NEO PI-R | Self-Consciousness | 72, 134, 49, 57, 30 | 0.64 | 0.69 | 0.74
5 | NEO PI-R | Impulsiveness | 2, 126R, 136, 165, 14R | 0.58 | 0.56 | 0.72
6 | NEO PI-R | Vulnerability | 57, 162, 33, 72, 147 | 0.66 | 0.65 | 0.79
7 | NEO PI-R | Warmth | 6, 170, 37R, 166, 171R | 0.72 | 0.63 | 0.80
8 | NEO PI-R | Gregariousness | 3, 73, 37R, 135R, 102R | 0.75 | 0.70 | 0.80
9 | NEO PI-R | Assertiveness | 4, 101, 163, 145R, 21R | 0.78 | 0.74 | 0.80
10 | NEO PI-R | Activity | 5, 22, 31R, 101, 163 | 0.62 | 0.65 | 0.72
11 | NEO PI-R | Excitement-Seeking | 44, 46, 106, 79R, 73 | 0.56 | 0.39 | 0.64
12 | NEO PI-R | Positive Emotions | 6, 99, 123R, 133, 37R | 0.65 | 0.59 | 0.81
13 | NEO PI-R | Fantasy | 74R, 138R, 142, 115, 59R | 0.67 | 0.55 | 0.82
14 | NEO PI-R | Aesthetics | 7R, 75, 109, 26R, 27 | 0.79 | 0.70 | 0.84
15 | NEO PI-R | Feelings | 19, 85R, 179, 150R, 148 | 0.60 | 0.59 | 0.75
16 | NEO PI-R | Actions | 42R, 27, 94, 92, 138R | 0.57 | 0.60 | 0.64
17 | NEO PI-R | Ideas | 110, 139R, 161R, 68, 100R | 0.72 | 0.69 | 0.82
18 | NEO PI-R | Values | 76, 54R, 59R, 156R, 98 | 0.65 | 0.47 | 0.78
19 | NEO PI-R | Trust | 8R, 123R, 160R, 166, 125R | 0.57 | 0.61 | 0.84
20 | NEO PI-R | Straightforwardness | 9R, 52R, 86R, 51R, 46R | 0.52 | 0.47 | 0.74
21 | NEO PI-R | Altruism | 10, 111, 123R, 65R, 166 | 0.57 | 0.58 | 0.72
22 | NEO PI-R | Compliance | 104, 172R, 178R, 65R, 34R | 0.62 | 0.60 | 0.73
23 | NEO PI-R | Modesty | 11R, 118R, 120R, 38R, 176 | 0.54 | 0.76 | 0.75
24 | NEO PI-R | Tender-Mindedness | 12, 77, 111, 114, 177 | 0.58 | 0.49 | 0.61
25 | NEO PI-R | Competence | 167, 57R, 116R, 137, 101 | 0.58 | 0.53 | 0.70
26 | NEO PI-R | Order | 13, 112, 90R, 14, 137 | 0.69 | 0.67 | 0.74
27 | NEO PI-R | Dutifulness | 151R, 14, 45R, 41, 116R | 0.41 | 0.34 | 0.67
28 | NEO PI-R | Achievement Striving | 25, 14, 4, 48, 145R | 0.62 | 0.60 | 0.67
29 | NEO PI-R | Self-Discipline | 14, 116R, 152R, 81, 167 | 0.64 | 0.53 | 0.80
30 | NEO PI-R | Deliberation | 15R, 35R, 136R, 41, 141 | 0.55 | 0.62 | 0.70
31 | HEXACO-PI | Sincerity | 9R, 78R, 17R, 86R, 51R | 0.52 | 0.53 | 0.74
32 | HEXACO-PI | Fairness | 16R, 46R, 87, 104, 32R | 0.54 | 0.52 | 0.78
33 | HEXACO-PI | Greed Avoidance | 17R, 97R, 118R, 78R, 16R | 0.54 | 0.66 | 0.81
34 | HEXACO-PI | Modesty | 11R, 118R, 97R, 120R, 78R | 0.64 | 0.75 | 0.80
35 | HEXACO-PI | Fearfulness | 79, 105R, 164R, 162, 132R | 0.67 | 0.49 | 0.79
36 | HEXACO-PI | Anxiety | 1R, 71, 162, 173R, 134 | 0.71 | 0.71 | 0.81
37 | HEXACO-PI | Dependence | 18, 113R, 147, 3, 168R | 0.56 | 0.53 | 0.78
38 | HEXACO-PI | Sentimentality | 19, 80, 143R, 113R, 127 | 0.74 | 0.57 | 0.79
39 | HEXACO-PI | Expressiveness | 20, 153, 163, 30R, 157 | 0.76 | 0.75 | 0.85
40 | HEXACO-PI | Social Boldness | 21R, 30R, 101, 163, 38 | 0.85 | 0.73 | 0.84
41 | HEXACO-PI | Sociability | 3, 37R, 88, 170, 73 | 0.72 | 0.66 | 0.81
42 | HEXACO-PI | Liveliness | 22, 31R, 6, 30R, 99 | 0.69 | 0.60 | 0.79
43 | HEXACO-PI | Forgiveness | 114, 50, 34R, 23, 121R | 0.62 | 0.58 | 0.84
44 | HEXACO-PI | Gentleness | 23, 24R, 104, 40R, 65R | 0.66 | 0.63 | 0.79
45 | HEXACO-PI | Flexibility | 24R, 40R, 23, 121R, 172R | 0.55 | 0.64 | 0.67
46 | HEXACO-PI | Patience | 24R, 23, 62, 172R, 104 | 0.69 | 0.68 | 0.80
47 | HEXACO-PI | Organization | 13, 90R, 116R, 112, 14 | 0.76 | 0.66 | 0.87
48 | HEXACO-PI | Diligence | 25, 81, 48, 14, 116R | 0.66 | 0.60 | 0.79
49 | HEXACO-PI | Perfectionism | 82R, 137, 41, 14, 174 | 0.59 | 0.51 | 0.73
50 | HEXACO-PI | Prudence | 41, 15R, 141, 14, 167 | 0.57 | 0.63 | 0.77
51 | HEXACO-PI | Aesthetic Appreciation | 26R, 83R, 75, 27, 7R | 0.75 | 0.67 | 0.81
52 | HEXACO-PI | Inquisitiveness | 27, 58, 83R, 139R, 68 | 0.72 | 0.55 | 0.79
53 | HEXACO-PI | Creativity | 84R, 115, 138R, 154, 68 | 0.73 | 0.63 | 0.81
54 | HEXACO-PI | Unconventionality | 28, 139R, 76, 115, 100R | 0.74 | 0.61 | 0.79
55 | JPI-R | Complexity | 139R, 76, 43, 100R, 59R | 0.62 | 0.61 | 0.66
56 | JPI-R | Breadth of Interest | 27, 43, 75, 26R, 83R | 0.64 | 0.69 | 0.82
57 | JPI-R | Innovation | 138R, 154, 84R, 115, 110 | 0.76 | 0.66 | 0.88
58 | JPI-R | Tolerance | 42R, 34R, 121R, 50, 59R | 0.55 | 0.46 | 0.65
59 | JPI-R | Empathy | 19, 85R, 113R, 143R, 148 | 0.59 | 0.66 | 0.76
60 | JPI-R | Anxiety | 1R, 71, 33, 162, 173R | 0.73 | 0.73 | 0.83
61 | JPI-R | Cooperativeness | 29, 47R, 95R, 158R, 162 | 0.66 | 0.64 | 0.79
62 | JPI-R | Sociability | 3, 37R, 135R, 170, 113R | 0.67 | 0.70 | 0.82
63 | JPI-R | Social Confidence | 30R, 99, 101, 21R, 88 | 0.76 | 0.71 | 0.87
64 | JPI-R | Energy Level | 31R, 22, 175R, 152R, 164 | 0.64 | 0.67 | 0.78
65 | JPI-R | Social Astuteness | 86, 9, 78, 127, 46 | 0.49 | 0.52 | 0.66
66 | JPI-R | Risk Taking | 16, 79R, 46, 61R, 44 | 0.64 | 0.45 | 0.84
67 | JPI-R | Organization | 13, 14, 116R, 90R, 48 | 0.66 | 0.65 | 0.73
68 | JPI-R | Traditional Values | 76R, 54, 156, 104, 142R | 0.68 | 0.59 | 0.79
69 | JPI-R | Responsibility | 32R, 87, 16R, 104, 46R | 0.38 | 0.52 | 0.66
70 | MPQ | Well-being | 117R, 6, 22, 57R, 160R | 0.63 | 0.58 | 0.9
71 | MPQ | Social Potency | 118, 38, 101, 4, 86 | 0.71 | 0.75 | 0.89
72 | MPQ | Achievement | 25, 110, 81, 137, 180 | 0.63 | 0.54 | 0.84
73 | MPQ | Social Closeness | 3, 37R, 135R, 170, 113R | 0.72 | 0.70 | 0.86
74 | MPQ | Stress Reaction | 33, 71, 1R, 57, 49 | 0.73 | 0.71 | 0.89
75 | MPQ | Aggression | 34, 52, 119, 24, 16 | 0.47 | 0.47 | 0.72
76 | MPQ | Alienation | 49, 125, 57, 160, 180 | 0.56 | 0.69 | 0.82
77 | MPQ | Control | 35R, 15R, 141, 41, 167 | 0.61 | 0.57 | 0.83
78 | MPQ | Harm-avoidance | 79, 16R, 132R, 61, 35R | 0.5 | 0.35 | 0.82
79 | MPQ | Traditionalism | 76R, 54, 61, 59, 100 | 0.73 | 0.52 | 0.87
80 | MPQ | Absorption | 36, 109, 75, 108, 28 | 0.60 | 0.59 | 0.90
81 | 6-FPQ | Affiliation | 37R, 88, 3, 170, 6 | 0.69 | 0.61 | 0.78
82 | 6-FPQ | Dominance | 89R, 101, 4, 118, 86 | 0.75 | 0.76 | 0.86
83 | 6-FPQ | Exhibition | 38, 120, 30R, 157, 37R | 0.77 | 0.70 | 0.80
84 | 6-FPQ | Abasement | 39R, 121R, 140R, 172R, 114 | 0.40 | 0.39 | 0.54
85 | 6-FPQ | Even-tempered | 62, 178R, 24R, 104, 33R | 0.62 | 0.65 | 0.65
86 | 6-FPQ | Good-natured | 40R, 24R, 172R, 121R, 174R | 0.41 | 0.55 | 0.58
87 | 6-FPQ | Cognitive Structure | 41, 122, 141, 15R, 131 | 0.54 | 0.51 | 0.56
88 | 6-FPQ | Deliberativeness | 15R, 41, 141, 35R, 167 | 0.63 | 0.57 | 0.68
89 | 6-FPQ | Order | 13, 90R, 14, 116R, 82R | 0.72 | 0.63 | 0.78
90 | 6-FPQ | Autonomy | 3R, 135, 28, 95, 113 | 0.60 | 0.54 | 0.59
91 | 6-FPQ | Individualism | 29R, 47, 17R, 95, 120R | 0.64 | 0.47 | 0.74
92 | 6-FPQ | Self Reliance | 91, 70, 170R, 18R, 113 | 0.46 | 0.42 | 0.57
93 | 6-FPQ | Change | 42R, 92, 94, 110, 132 | 0.52 | 0.58 | 0.63
94 | 6-FPQ | Understanding | 43, 27, 69, 68, 139R | 0.69 | 0.65 | 0.74
95 | 6-FPQ | Breadth of Interest | 27, 26R, 83R, 75, 139R | 0.68 | 0.62 | 0.69
96 | 6-FPQ | Achievement | 25, 81, 48, 152R, 167 | 0.46 | 0.58 | 0.47
97 | 6-FPQ | Endurance | 81, 25, 110, 137, 82R | 0.46 | 0.58 | 0.59
98 | 6-FPQ | Seriousness | 35R, 93R, 142R, 44R, 94R | 0.48 | 0.45 | 0.61
99 | TCI | Exploratory Excitability | 44, 94, 92, 42R, 84R | 0.67 | 0.58 | 0.72
100 | TCI | Impulsiveness | 35, 41R, 15, 141R, 131R | 0.56 | 0.52 | 0.75
101 | TCI | Extravagance | 45, 155R, 165, 169, 15 | 0.69 | 0.68 | 0.83
102 | TCI | Disorderliness | 46, 9, 16, 86, 104R | 0.51 | 0.52 | 0.68
103 | TCI | Worry & pessimism | 1R, 123, 71, 173R, 57 | 0.69 | 0.70 | 0.80
104 | TCI | Fear of uncertainty | 79, 162, 164R, 1R, 132R | 0.68 | 0.48 | 0.75
105 | TCI | Shyness with strangers | 30, 88R, 99R, 37, 21 | 0.69 | 0.71 | 0.87
106 | TCI | Fatigability & asthenia | 31, 22R, 175, 152, 167R | 0.61 | 0.64 | 0.85
107 | TCI | Sentimentality | 19, 143R, 80, 127, 166 | 0.65 | 0.54 | 0.71
108 | TCI | Warm communication | 37R, 171R, 88, 6, 85R | 0.73 | 0.67 | 0.86
109 | TCI | Attachment | 85R, 168R, 171R, 179, 20 | 0.74 | 0.69 | 0.86
110 | TCI | Dependence | 47R, 95R, 70R, 28R, 158R | 0.54 | 0.61 | 0.58
111 | TCI | Eagerness of effort | 48, 144, 152R, 81, 22 | 0.58 | 0.64 | 0.84
112 | TCI | Work hardened | 137, 66, 81, 110, 144 | 0.53 | 0.47 | 0.75
113 | TCI | Ambitious | 25, 4, 124, 145R, 48 | 0.62 | 0.56 | 0.79
114 | TCI | Perfectionist | 25, 14, 81, 180, 137 | 0.60 | 0.57 | 0.76
115 | TCI | Responsibility | 49R, 57R, 125R, 123R, 1 | 0.53 | 0.65 | 0.78
116 | TCI | Purposefulness | 96R, 117R, 57R, 101, 164 | 0.53 | 0.58 | 0.77
117 | TCI | Resourcefulness | 145R, 161R, 72R, 1, 164 | 0.63 | 0.57 | 0.72
118 | TCI | Self-acceptance | 97R, 17R, 9R, 49R, 131R | 0.46 | 0.43 | 0.82
119 | TCI | Enlightened second nature | 126, 136R, 165R, 33R, 14 | 0.50 | 0.54 | 0.84
120 | TCI | Social acceptance | 50, 40R, 24R, 77, 11R | 0.52 | 0.59 | 0.77
121 | TCI | Empathy | 19, 127, 10, 177, 77 | 0.62 | 0.65 | 0.67
122 | TCI | Helpfulness | 51R, 77, 34R, 123R, 60R | 0.39 | 0.57 | 0.64
123 | TCI | Compassion | 52R, 34R, 50, 172R, 114 | 0.63 | 0.63 | 0.88
124 | TCI | Pure-hearted conscience | 53, 51R, 54, 9R, 21R | 0.44 | 0.42 | 0.58
125 | TCI | Self-forgetful | 128, 115, 98, 36, 148 | 0.66 | 0.54 | 0.79
126 | TCI | Transpersonal identification | 98, 19, 148, 6, 12 | 0.58 | 0.60 | 0.77
127 | TCI | Spiritual acceptance | 53, 156, 54, 114, 6 | 0.80 | 0.73 | 0.90
128 | TCI | Enlightened | 53, 54, 156, 114, 6 | 0.83 | 0.73 | 0.95
129 | TCI | Idealistic | 54, 156, 53, 114, 6 | 0.76 | 0.73 | 0.82
130 | CPI | Dominance | 21R, 101, 4, 30R, 163 | 0.78 | 0.76 | 0.85
131 | CPI | Capacity for Status | 30R, 21R, 99, 38, 72R | 0.51 | 0.64 | 0.69
132 | CPI | Sociability | 99, 30R, 21R, 37R, 101 | 0.68 | 0.70 | 0.78
133 | CPI | Social Presence | 99, 38, 30R, 133, 72R | 0.63 | 0.58 | 0.73
134 | CPI | Self-acceptance | 21R, 101, 30R, 163, 99 | 0.69 | 0.74 | 0.65
135 | CPI | Independence | 72R, 21R, 162R, 57R, 71R | 0.63 | 0.59 | 0.7
136 | CPI | Empathy | 99, 30R, 21R, 100R, 133 | 0.56 | 0.58 | 0.64
137 | CPI | Responsibility | 55, 129R, 60R, 104, 32R | 0.36 | 0.40 | 0.72
138 | CPI | Socialization | 56, 63R, 33R, 46R, 104 | 0.56 | 0.53 | 0.72
139 | CPI | Self-control | 46R, 130R, 33R, 15R, 136R | 0.52 | 0.60 | 0.79
140 | CPI | Good Impression | 33R, 136R, 169R, 129R, 24R | 0.49 | 0.44 | 0.78
141 | CPI | Communality | 31R, 165R, 58, 93, 162R | 0.16 | 0.24 | N/A
142 | CPI | Well-being | 33R, 57R, 160R, 159R, 49R | 0.60 | 0.59 | 0.8
143 | CPI | Tolerance | 129R, 60R, 49R, 181R, 121R | 0.44 | 0.52 | 0.71
144 | CPI | Achievement via Conformance | 55, 15R, 57R, 96R, 60R | 0.48 | 0.43 | 0.69
145 | CPI | Achievement via Independence | 100R, 49R, 139R, 61R, 58 | 0.53 | 0.42 | 0.75
146 | CPI | Intellectual Efficiency | 57R, 68, 58, 160R, 55 | 0.64 | 0.45 | 0.73
147 | CPI | Psychological-mindedness | 58, 57R, 49R, 160R, 68 | 0.48 | 0.50 | 0.55
148 | CPI | Flexibility | 59R, 131R, 13R, 14R, 122R | 0.58 | 0.55 | 0.72
149 | CPI | Femininity | 105R, 66R, 79, 162, 89 | 0.59 | 0.52 | 0.66
150 | CPI | Vector 1 | 101R, 118R, 21, 38R, 4R | 0.79 | 0.72 | 0.85
151 | CPI | Vector 2 | 56, 14, 48, 169R, 104 | 0.49 | 0.37 | 0.74
152 | CPI | Vector 3 | 60R, 49R, 174R, 100R, 160R | 0.50 | 0.46 | 0.85
153 | CPI | Managerial Potential | 57R, 129R, 21R, 33R, 60R | 0.58 | 0.49 | 0.79
154 | CPI | Work Orientation | 33R, 57R, 160R, 165R, 159R | 0.53 | 0.49 | 0.73
155 | CPI | Creative Temperament | 61R, 100R, 131R, 138R, 174R | 0.5 | 0.45 | 0.76
156 | CPI | Leadership | 57R, 72R, 21R, 96R, 101 | 0.71 | 0.60 | 0.87
157 | CPI | Amicability | 33R, 123R, 160R, 60R, 56 | 0.55 | 0.54 | 0.79
158 | CPI | Law Enforcement Orientation | 14, 137, 116R, 152R, 101 | 0.35 | 0.55 | 0.53
159 | CPI | Tough-mindedness | 57R, 72R, 136R, 33R, 49R | 0.59 | 0.67 | 0.74
160 | HPI | Empathy | 62, 24R, 173, 123R, 23 | 0.58 | 0.63 | 0.62
161 | HPI | Not anxious | 1, 71R, 33R, 173, 162R | 0.67 | 0.73 | 0.82
162 | HPI | No guilt | 57R, 49R, 33R, 160R, 159R | 0.56 | 0.59 | 0.69
163 | HPI | Calmness | 33R, 57R, 162R, 178R, 148R | 0.55 | 0.56 | 0.44
164 | HPI | Even-tempered | 33R, 123R, 62, 24R, 60R | 0.54 | 0.68 | 0.59
165 | HPI | No somatic complaints | 31R, 22, 57R, 175R, 71R | 0.47 | 0.67 | 0.56
166 | HPI | Trusting | 8R, 123R, 125R, 181R, 60R | 0.48 | 0.58 | 0.56
167 | HPI | Good attachment | 63R, 56, 169R, 65R, 151R | 0.59 | 0.48 | 0.78
168 | HPI | Competitive | 101, 164, 145R, 25, 89R | 0.45 | 0.69 | 0.55
169 | HPI | Self confidence | 72R, 57R, 101, 134R, 145R | 0.58 | 0.68 | 0.6
170 | HPI | No depression | 57R, 96R, 33R, 160R, 123R | 0.61 | 0.71 | 0.78
171 | HPI | Leadership | 101, 4, 89R, 118, 163 | 0.76 | 0.77 | 0.86
172 | HPI | Identity | 96R, 57R, 49R, 41, 117R | 0.39 | 0.58 | 0.82
173 | HPI | No social anxiety | 21R, 30R, 99, 101, 72R | 0.70 | 0.70 | 0.75
174 | HPI | Likes parties | 73, 3, 88, 44, 37R | 0.64 | 0.67 | 0.67
175 | HPI | Likes crowds | 102R, 73, 3, 37R, 44 | 0.5 | 0.66 | 0.80
176 | HPI | Experience-seeking | 94, 132, 44, 27, 42R | 0.6 | 0.58 | 0.68
177 | HPI | Exhibitionistic | 38, 176R, 120, 78, 130 | 0.61 | 0.80 | 0.74
178 | HPI | Entertaining | 64, 103R, 133, 157, 153 | 0.71 | 0.74 | 0.67
179 | HPI | Easy to live with | 50, 65R, 23, 34R, 6 | 0.42 | 0.59 | 0.55
180 | HPI | Sensitive | 19, 177, 10, 51R, 127 | 0.36 | 0.67 | 0.29
181 | HPI | Caring | 19, 166, 177, 127, 170 | 0.48 | 0.59 | 0.43
182 | HPI | Likes people | 37R, 171R, 3, 88, 170 | 0.62 | 0.68 | 0.75
183 | HPI | No hostility | 34R, 50, 123R, 172R, 40R | 0.49 | 0.63 | 0.43
184 | HPI | Moralistic | 48, 146, 87, 144, 69R | 0.40 | 0.37 | 0.46
185 | HPI | Mastery | 14, 122, 48, 25, 137 | 0.41 | 0.61 | 0.34
186 | HPI | Virtuous | 65R, 104, 23, 8R, 146 | 0.43 | 0.56 | 0.34
187 | HPI | not autonomous | 47R, 95R, 29, 147, 158R | 0.59 | 0.68 | 0.70
188 | HPI | Not spontaneous | 36R, 148R, 98R, 46R, 142R | 0.19 | 0.38 | 0.36
189 | HPI | Impulse control | 35R, 46R, 15R, 16R, 142R | 0.60 | 0.54 | 0.6
190 | HPI | Avoids trouble | 158R, 46R, 28R, 181R, 49R | 0.37 | 0.45 | 0.53
191 | HPI | Science ability | 58, 105, 66, 110, 138R | 0.60 | 0.62 | 0.69
192 | HPI | Curiosity | 66, 105, 58, 110, 95 | 0.60 | 0.60 | 0.64
193 | HPI | Thrill-seeking | 79R, 132, 46, 44, 106 | 0.46 | 0.45 | 0.65
194 | HPI | Intellectual games | 106, 110, 176 | 0.33 | 0.22 | 0.50
195 | HPI | Generates ideas | 101, 138R, 157, 103R, 153 | 0.55 | 0.59 | 0.67
196 | HPI | Culture | 7R, 83R, 27, 139R, 26R | 0.60 | 0.60 | 0.59
197 | HPI | Education | 55, 107R, 68, 69, 61R | 0.58 | 0.67 | 0.77
198 | HPI | Math ability | 67R, 106, 110 | 0.60 | 0.44 | 0.78
199 | HPI | Good memory | 68, 107R, 55, 69, 82R | 0.51 | 0.65 | 0.54
200 | HPI | Reading | 69, 149, 43, 68, 107R | 0.75 | 0.77 | 0.71
201 | HPI | Self focus | 108, 150R, 159, 49, 33 | 0.52 | 0.39 | 0.69
202 | HPI | Impression management | 49, 33, 29, 57, 46 | 0.43 | 0.56 | 0.51
203 | HPI | Appearance | 70R, 95R, 13, 28R | 0.43 | 0.54 | 0.44
`.trim();

function parseNumber(value: string) {
  const normalized = value.trim();

  if (normalized === "N/A") {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseKey(key: string) {
  return key.split(",").map((token) => {
    const normalized = token.trim();
    const reverse = normalized.endsWith("R");
    const order = Number.parseInt(reverse ? normalized.slice(0, -1) : normalized, 10);

    return {
      order,
      reverse,
    };
  });
}

export const ambiScaleDefinitions: ScaleDefinition[] = RAW_AMBI_SCORING_ROWS.split("\n").map((row) => {
  const [scaleNo, inventoryLabel, name, key, convergentCorrelation, alphaGa, alphaOriginal] = row
    .split("|")
    .map((part) => part.trim());
  const inventoryCode = INVENTORY_CODE_BY_LABEL[inventoryLabel];

  if (!inventoryCode) {
    throw new Error(`Unsupported inventory label: ${inventoryLabel}`);
  }

  return {
    code: `${inventoryCode}-${scaleNo}`,
    scaleNo: Number.parseInt(scaleNo, 10),
    inventoryCode,
    inventoryLabel,
    name,
    key,
    keyedItems: parseKey(key),
    convergentCorrelation: parseNumber(convergentCorrelation),
    alphaGa: parseNumber(alphaGa),
    alphaOriginal: parseNumber(alphaOriginal),
  };
});

export const ambiScaleDefinitionMap = new Map(
  ambiScaleDefinitions.map((definition) => [definition.scaleNo, definition]),
);

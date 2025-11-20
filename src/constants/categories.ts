/**
 * 固定8个分类标签配置
 */
export interface CategoryInfo {
  id: string
  name: string
  icon: string
  color: string
  bgColor: string
  description: string
}

export const CATEGORIES: CategoryInfo[] = [
  {
    id: 'politics',
    name: '政治',
    icon: '',
    color: '#C7CEEA',
    bgColor: '#E8E5F5',
    description: '国内外政治、政府政策、外交、选举',
  },
  {
    id: 'economy',
    name: '经济',
    icon: '',
    color: '#FCDC94',
    bgColor: '#FEF3D5',
    description: '股市、金融、房地产、企业、财经',
  },
  {
    id: 'culture',
    name: '文化',
    icon: '',
    color: '#FFB4B4',
    bgColor: '#FFE5E5',
    description: '文艺、历史、传统、艺术、文学',
  },
  {
    id: 'tech',
    name: '科技',
    icon: '',
    color: '#95E1D3',
    bgColor: '#E0F7F4',
    description: 'AI、互联网、手机、科学发现、创新',
  },
  {
    id: 'sports',
    name: '体育',
    icon: '',
    color: '#4ECDC4',
    bgColor: '#D5F7F5',
    description: '足球、篮球、奥运、比赛、运动员',
  },
  {
    id: 'entertainment',
    name: '娱乐',
    icon: '',
    color: '#FF6B6B',
    bgColor: '#FFE0E0',
    description: '明星、电影、音乐、综艺、八卦',
  },
  {
    id: 'society',
    name: '社会',
    icon: '',
    color: '#AAD8D3',
    bgColor: '#E5F3F1',
    description: '民生、事故、犯罪、社会热点、公益',
  },
  {
    id: 'military',
    name: '军事',
    icon: '',
    color: '#B5E7A0',
    bgColor: '#E8F5E0',
    description: '国防、武器、军演、战争、军队',
  },
]

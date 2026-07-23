export type ScoreGuide = {
  title: string;
  subtitle?: string;
  subtitleDescription?: string;
  table: { score: number; description: string }[];
};

export const scoreGuides: Record<string, ScoreGuide> = {
  mood: {
    title: "기분 평가 기준",
    table: [
      {
        score: -4,
        description:
          "극도로 우울하거나 쳐진다. 자신을 돌보는 일과 해야 할 일을 전혀 못하고 극심한 불안, 초조, 자살사고로 인해 다른 사람의 돌봄을 요한다.",
      },
      {
        score: -3,
        description:
          "꽤 우울하고 쳐진다. 외출, 쇼핑 등 사회 생활에 뚜렷한 지장이 있고 학교, 직장에 나가지 못하거나 집안 일을 하지 못하는 일이 생긴다. <b>노력하여도 업무를 수행하는 기능의 저하가 뚜렷하다.</b>",
      },
      {
        score: -2,
        description:
          "우울하고 쳐지고, 사회 생활에 뚜렷한 지장이 있어 주변에서 우울한 것에 대해 알아본다. <b>일상생활에 약간의 지장이 생기지만 노력을 하면 일상을 유지 할 수 있다.</b>",
      },
      {
        score: -1,
        description:
          "시큰둥하고 의욕이 다소 떨어져 있는 등의 우울한 증상을 가지고는 있으나 업무를 수행하는 기능에 별 영향이 없음. <b>주관적으로 느끼는 우울은 뚜렷하지만 주변에서 우울한 것에 대해 잘 모르는 경우가 많다.</b>",
      },
      {
        score: 0,
        description:
          "기분이 보통이고 편안한 상태. 해야 하는 일을 모두 수행함. 업무수행 정도에 변화가 없고 기능의 변화가 없음.",
      },
      {
        score: 1,
        description:
          "평상시 기분이 좋은 것 이상으로 기분이 좋고, 의욕이 늘어나며, 때때로 짜증이 나기도 하는 등의 증상을 주관적으로 느끼지만, <b>주변에서 그 변화를 알아보지 못한다.</b> 집중을 하면 해야 하는 일을 실수하지 않고 마칠 수 있다.",
      },
      {
        score: 2,
        description:
          "말이나 하고 싶은 게 많아지고, 자신감에 차있고, 과도하게 짜증을 내는 등의 들뜬 증상이 뚜렷하여 <b>주변에서 평소와 다르다는 피드백을 받는다.</b> 일상생활에 약간의 지장이 생기지만 노력하면 일상을 유지할 수 있다.",
      },
      {
        score: 3,
        description:
          "나선다, 기고만장 하다, 감당하기 힘들 만큼 일을 벌이고 사소한 일에도 울화통을 터트리는 등의 증상으로 <b>주변 사람들과 다투거나 법적인 문제가 생기기도 한다.</b> 감당하기 힘든 정도의 지출을 하거나 충동적인 여행을 떠난다.",
      },
      {
        score: 4,
        description:
          "극도로 들뜸, 사람이나 물건에 대해 폭력을 휘두르기도 함. 환청이나 망상이 심하여 입원을 요하는 상태.",
      },
    ],
  },
  anxiety: {
    title: "두려움/소심함/걱정/불안 평가 기준",
    subtitle: "정서 반응",
    subtitleDescription:
      "정서반응이 일어날 만한 사건이 없었더라도 그러한 사건이 있었다면 어땠을 지 생각해보며 적어볼 수 있습니다.<br /><br />+: 평소에는 신경 쓰지 않을 일에 대해서도 두렵고, 소심하고, 걱정하고 불안하게 됨.<br />-: 평소에는 느껴야할 두려움/소심함/걱정/불안도 느낄 수 없음.<br /><br />※기분증상과 정서반응이 같은 방향으로 함께 움직이는지 관찰합니다.",
    table: [
      { score: -4, description: "위협적인 자극이나 사건도 전혀 대수롭지 않게 느껴짐." },
      { score: -3, description: "매우 중요한 일들이 있어도 전혀 대수롭지 않게 느껴짐." },
      {
        score: -2,
        description: "보다 중요하게 신경써야 하는 일들에 대해서도 대수롭지 않게 느껴짐.",
      },
      {
        score: -1,
        description: "사소하게 신경써야 하는 일들에 대해 반응하지 않고 지나치게 됨.",
      },
      { score: 0, description: "평소 편안할 때의 모습과 가장 가까운 정도." },
      {
        score: 1,
        description: "평소엔 신경쓰이지 않을 일들이 이런 감정을 일으키지만 내색하지 않음.",
      },
      {
        score: 2,
        description: "신경쓰이는 일들에 대해서 이런 감정을 말이나 행동으로 표현하게 됨.",
      },
      {
        score: 3,
        description: "이런 감정을 느끼는 것을 다른 사람이 쉽게 알 수 있을 정도로 표현.",
      },
      { score: 4, description: "이러한 감정에 휩싸여서 다른 감정을 느낄 수 없음." },
    ],
  },
  anger: {
    title: "짜증/분노 평가 기준",
    subtitle: "정서 반응",
    subtitleDescription:
      "정서반응이 일어날 만한 사건이 없었더라도 그러한 사건이 있었다면 어땠을 지 생각해보며 적어볼 수 있습니다.<br /><br />+: 평소라면 지나칠 만한 일에도 신경이 예민해지고 화가 난다.<br />-: 누구라도 화를 내야할 만한 일에 대해서도 아무렇지 않다.<br /><br />※기분증상과 정서반응이 같은 방향으로 함께 움직이는지 관찰합니다.",
    table: [
      { score: -4, description: "위협적인 자극이나 사건도 아무렇지 않게 느껴지고 반응하지 않음." },
      { score: -3, description: "갈등이 있더라도 나서야 하는 일에 대해서도 나서지 못함." },
      {
        score: -2,
        description: "말이나 행동으로 스트레스에 대해 표현해야 할 때에도 표현하지 못함.",
      },
      { score: -1, description: "사소한 스트레스 대해 반응하지 않고 지나치게 됨." },
      { score: 0, description: "합리적인 범위 안에서의 짜증과 분노." },
      { score: 1, description: "평소라면 신경쓰이지 않을 일들이 신경쓰이지만 내색하지 않음." },
      { score: 2, description: "신경쓰이는 일들에 대해서 말이나 행동으로 표현하게 됨." },
      {
        score: 3,
        description: "신경쓰이는 일들에 대해 다른 사람과 갈등이 생길 정도로 표현하게 됨.",
      },
      {
        score: 4,
        description: "신경쓰이는 일들에 대해서 폭력, 폭언, 충동적인 행동/생각을 하게 됨.",
      },
    ],
  },
  interest: {
    title: "관심/흥미/즐거움/소비/계획 평가 기준",
    subtitle: "의욕",
    subtitleDescription:
      "+: 평소보다 관심과 흥미가 많아지고, 같은 일을 해도 더욱 즐겁고, 돈을 쓸 일도 많아지거나, 투자를 하거나, 일이나 취미, 약속 등 계획이 많아짐.<br />-: 평소보다 하는 일이 관심도 흥미도 떨어지고, 즐겁던 일도 즐겁지 않고, 돈을 쓰는 일도 줄어들고, 일이나 취미, 약속에 대한 생각도 줄어듦.",
    table: [
      { score: -4, description: "거의 시간, 에너지, 돈을 사용하는 일이 없고, 공허하게 보냄." },
      {
        score: -3,
        description: "평소보다 크게 감소하여 시간, 에너지, 돈을 쓰는 일이 매우 적음.",
      },
      { score: -2, description: "평소보다 확연히 감소함." },
      { score: -1, description: "평소보다 조금 감소함." },
      { score: 0, description: "평소 편안할 때의 모습과 가장 가까운 정도를 0으로 함." },
      { score: 1, description: "평소보다 조금 증가함." },
      { score: 2, description: "평소보다 확연히 증가함." },
      {
        score: 3,
        description: "평소보다 크게 증가하여 상당한 시간, 에너지, 돈을 사용하여 부담이 됨.",
      },
      {
        score: 4,
        description: "매우 큰 시간, 에너지, 돈을 사용하여 상당한 부담이 되고 어려움이 발생.",
      },
    ],
  },
  activity: {
    title: "활동량 평가 기준",
    subtitle: "의욕",
    subtitleDescription:
      "+: 평소보다 많이 움직이고 많은 일을 처리함.<br />-: 평소보다 적게 움직이고, 일도 적게 함.",
    table: [
      { score: -4, description: "매우 활동량이 적어 거의 하루 종일 누워만 있는 정도." },
      { score: -3, description: "평소보다 크게 감소하여 활동량이 매우 적은 정도." },
      { score: -2, description: "평소보다 확연히 감소함." },
      { score: -1, description: "평소보다 조금 감소함." },
      { score: 0, description: "평소 편안할 때의 모습과 가장 가까운 정도를 0으로 함." },
      { score: 1, description: "평소보다 조금 증가함." },
      { score: 2, description: "평소보다 확연히 증가함." },
      { score: 3, description: "평소보다 크게 증가하여 평소 체력에 비하면 부담이 될 정도." },
      {
        score: 4,
        description: "매우 활동량이 많아 평소 체력에 비하면 상당한 부담이 되어 소진될 정도.",
      },
    ],
  },
  thoughtSpeed: {
    title: "생각의 속도와 양 평가 기준",
    subtitle: "생각",
    subtitleDescription:
      "+: 생각이 빨라지고 꼬리에 꼬리를 물고 이어짐, 많은 아이디어가 떠오르거나 생각에 골몰함. 때로는 말수가 많아지거나 글을 많이 쓰게 됨.<br />-: 생각이 느려지고 떠오르지 않음. 말을 하는 것도 쉽지 않고, 떠오르는 것이 적음.",
    table: [
      {
        score: -4,
        description: "매우 크게 감소하여 의사소통이 불가능하고 거의 생각이 없는 정도.",
      },
      {
        score: -3,
        description: "평소보다 크게 감소하여 다른 사람이 보기에 느리고 답답하게 느껴짐.",
      },
      { score: -2, description: "평소보다 확연히 감소함." },
      { score: -1, description: "평소보다 조금 감소함." },
      { score: 0, description: "평소 편안할 때의 모습과 가장 가까운 정도를 0으로 함." },
      { score: 1, description: "평소보다 조금 증가함." },
      { score: 2, description: "평소보다 확연히 증가함." },
      { score: 3, description: "평소보다 크게 증가하여 다른 사람이 듣는다면 따라잡기 어려움." },
      { score: 4, description: "매우 크게 증가하여 자기 자신도 따라가기 어렵고 혼란스러움." },
    ],
  },
  thoughtContent: {
    title: "생각의 내용 평가 기준",
    subtitle: "생각",
    subtitleDescription:
      "+: 평소보다 낙관적임. 무엇이든 잘될 것 같은 생각이 들고 자신감이 생김. 심한 경우 자신이 특별하다는 생각이 듦.<br />-: 평소보다 부정적임. 무엇이든 잘되지 않을 것 같고, 자신감이 떨어짐. 심한 경우 죄책감이나 죽고 싶은 생각이 듦.",
    table: [
      {
        score: -4,
        description: "매우 부정적이어서 모든 일이 잘되지 않고, 삶의 의미가 없고, 무능력하다고 생각.",
      },
      {
        score: -3,
        description:
          "평소보다 크게 부정적인 생각이 늘어나 다른 사람들이 듣는다면 지나치다고 생각할 정도.",
      },
      { score: -2, description: "평소보다 확연히 부정적인 생각을 많이 함." },
      { score: -1, description: "평소보다 조금 부정적인 생각을 많이 함." },
      { score: 0, description: "평소 편안할 때의 모습과 가장 가까운 정도를 0으로 함." },
      { score: 1, description: "평소보다 조금 긍정적인 생각을 많이 함." },
      { score: 2, description: "평소보다 확연히 긍정적인 생각을 많이 함." },
      {
        score: 3,
        description:
          "평소보다 크게 긍정적인 생각이 늘어나 다른 사람들이 듣는다면 지나치다고 생각할 정도.",
      },
      {
        score: 4,
        description: "매우 긍정적이어서 모든 일이 잘되고, 자신이 특별하고, 능력이 있다고 생각.",
      },
    ],
  },
};

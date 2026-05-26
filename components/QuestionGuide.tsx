export default function QuestionGuide() {
  const questions = [
    {
      num: 'Q1',
      label: '结果',
      text: '今天你负责的一个可验收结果是什么？完成了吗？没完成的真正原因？',
    },
    {
      num: 'Q2',
      label: '卡点',
      text: '这个卡点是缺标准、缺流程、缺模板、缺案例，还是缺别人配合？它以后还会重复出现吗？',
    },
    {
      num: 'Q3',
      label: '亮点',
      text: '今天哪个动作最有效？为什么有效？能不能复制到其他产品或同事身上？',
    },
    {
      num: 'Q4',
      label: '案例',
      text: '今天有没有一个用户反馈、聊天记录、成交原因或拒绝原因值得保存？',
    },
    {
      num: 'Q5',
      label: '流程',
      text: '今天哪个动作重复、费时、烦？重复了几次？哪一步可以交给 AI？',
    },
    {
      num: 'Q6',
      label: '目标',
      text: '明天的最小闭环动作是什么？做完这一个动作会新增什么团队资产？',
    },
  ]

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">6 个参考问题</p>
      {questions.map((q) => (
        <div key={q.num} className="flex gap-2">
          <span className="shrink-0 w-16 text-xs font-bold text-indigo-500">
            {q.num} {q.label}
          </span>
          <p className="text-xs text-gray-500 leading-relaxed">{q.text}</p>
        </div>
      ))}
    </div>
  )
}

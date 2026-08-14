// assets/charts.js — 报告图表（ECharts）
(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();
  var ok = style.getPropertyValue('--ok').trim();

  // --- Chart: 付费档位阶梯（英雄没有闪 App Store IAP） ---
  var tier = echarts.init(document.getElementById('chart-tier'), null, { renderer: 'svg' });
  tier.setOption({
    animation: false,
    tooltip: {
      trigger: 'axis',
      appendToBody: true,
      backgroundColor: bg2,
      borderColor: rule,
      textStyle: { color: ink, fontSize: 13 }
    },
    grid: { left: 52, right: 24, top: 34, bottom: 40 },
    xAxis: {
      type: 'category',
      data: ['6元', '12元', '18元', '30元', '68元', '98元', '128元', '198元'],
      axisLine: { lineStyle: { color: rule } },
      axisLabel: { color: muted, fontFamily: 'DMMono', fontSize: 12 },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      name: '售价（元）',
      nameTextStyle: { color: muted, fontSize: 12 },
      axisLine: { show: false },
      axisLabel: { color: muted, fontFamily: 'DMMono', fontSize: 12 },
      splitLine: { lineStyle: { color: rule } }
    },
    series: [{
      type: 'bar',
      data: [
        { value: 6, itemStyle: { color: ok } },
        { value: 12, itemStyle: { color: ok } },
        { value: 18, itemStyle: { color: ok } },
        { value: 30, itemStyle: { color: accent } },
        { value: 68, itemStyle: { color: accent } },
        { value: 98, itemStyle: { color: accent2 } },
        { value: 128, itemStyle: { color: accent2 } },
        { value: 198, itemStyle: { color: accent2 } }
      ],
      barWidth: '52%',
      label: {
        show: true,
        position: 'top',
        color: ink,
        fontFamily: 'DMMono',
        fontSize: 12,
        formatter: function(p) { return '¥' + p.value; }
      },
      itemStyle: { borderRadius: [6, 6, 0, 0] }
    }]
  });
  window.addEventListener('resize', function() { tier.resize(); });
})();

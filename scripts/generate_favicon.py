from PIL import Image, ImageDraw

# 创建一个32x32的图像
img = Image.new('RGB', (32, 32), color='white')
draw = ImageDraw.Draw(img)

# 画一个简单的神经元图标
draw.ellipse([8, 8, 24, 24], fill='#4a90e2')  # 细胞体
draw.line([16, 0, 16, 8], fill='#2c3e50', width=2)  # 轴突
draw.line([16, 24, 16, 32], fill='#2c3e50', width=2)  # 树突
draw.line([0, 16, 8, 16], fill='#2c3e50', width=2)  # 侧枝
draw.line([24, 16, 32, 16], fill='#2c3e50', width=2)  # 侧枝

# 保存到多个位置
img.save('morphtesser_web/backend/src/main/resources/static/favicon.ico')
img.save('morphtesser_web/backend/src/main/resources/public/favicon.ico')
img.save('morphtesser_web/frontend/public/favicon.ico') 
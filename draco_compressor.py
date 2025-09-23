#!/usr/bin/env python3
"""
Draco压缩器 - 使用trimesh + DracoPY库
"""

import os
import sys
import numpy as np
import trimesh
import DracoPy

def compress_obj_to_draco(obj_file_path, output_path=None, 
                        compression_level=7, quantization_bits=10):
    """
    使用trimesh + DracoPY压缩OBJ文件为Draco格式
    
    Args:
        obj_file_path: OBJ文件路径
        output_path: 输出路径，如果为None则使用临时文件
        compression_level: 压缩级别 (0-10)
        quantization_bits: 量化位数 (1-31)
    
    Returns:
        dict: 包含压缩结果的字典
    """
    try:
        if not os.path.exists(obj_file_path):
            raise FileNotFoundError(f"OBJ文件不存在: {obj_file_path}")
        
        # 生成输出路径
        if output_path is None:
            output_path = obj_file_path.replace('.obj', '.drc')
        
        # 获取原始文件大小
        original_size = os.path.getsize(obj_file_path)
        
        print(f"开始压缩: {obj_file_path}")
        print(f"压缩参数: level={compression_level}, bits={quantization_bits}")
        
        # 使用trimesh读取OBJ文件
        mesh = trimesh.load(obj_file_path, process=False)
        
        # 提取顶点和面数据
        points = mesh.vertices.astype(np.float32)
        faces = mesh.faces.astype(np.int32)
        
        print(f"解析完成: {len(points)} 个顶点, {len(faces)} 个面")
        
        # 使用DracoPY进行压缩
        compressed = DracoPy.encode(
            points,
            faces=faces,
            quantization_bits=quantization_bits,
            compression_level=compression_level
        )
        
        # 保存Draco文件
        with open(output_path, 'wb') as f:
            f.write(compressed)
        
        compressed_size = os.path.getsize(output_path)
        compression_ratio = 1 - (compressed_size / original_size) if original_size > 0 else 0
        
        print(f"压缩完成: {original_size} -> {compressed_size} bytes")
        print(f"压缩率: {compression_ratio:.2%}")
        
        return {
            "success": True,
            "output_path": output_path,
            "original_size": original_size,
            "compressed_size": compressed_size,
            "compression_ratio": compression_ratio,
            "method": "trimesh_draco_py",
            "vertices_count": len(points),
            "faces_count": len(faces)
        }
        
    except Exception as e:
        print(f"压缩失败: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "original_size": original_size if 'original_size' in locals() else 0,
            "compressed_size": 0,
            "compression_ratio": 0
        }

# 命令行接口
if __name__ == "__main__":
    if len(sys.argv) != 5:
        print("用法: python draco_compressor.py <input_obj> <output_drc> <compression_level> <quantization_bits>")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    compression_level = int(sys.argv[3])
    quantization_bits = int(sys.argv[4])
    
    result = compress_obj_to_draco(
        input_file, 
        output_file, 
        compression_level, 
        quantization_bits
    )
    
    if result["success"]:
        print(f"✅ 压缩成功: {result['original_size']} -> {result['compressed_size']} bytes")
        print(f"📊 压缩率: {result['compression_ratio']:.2%}")
        sys.exit(0)
    else:
        print(f"❌ 压缩失败: {result['error']}")
        sys.exit(1) 
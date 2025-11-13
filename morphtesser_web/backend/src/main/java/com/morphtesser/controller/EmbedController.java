package com.morphtesser.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClientException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.client.RestTemplate;

import com.morphtesser.service.SmbFileService;

@RestController
@RequestMapping("/api/embed")
public class EmbedController {

    @Value("${dataset.neuromorpho.remote-base:http://localhost:5000/shared/morphtesser_exp/neuromorpho}")
    private String defaultRemoteBase;

    @Autowired
    private SmbFileService smbFileService;

    private String buildRemoteUrl(String base, String id, String quality, String format) {
        // 将ID转换为数字，然后格式化为6位数字（不足6位前面补0）
        int idNum;
        try {
            idNum = Integer.parseInt(id);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("ID格式无效: " + id);
        }
        
        // 格式化为6位数字，不足6位前面补0（用于查找目录）
        String formattedId = String.format("%06d", idNum);
        String group = formattedId.substring(0, 3);
        
        // 根据format参数选择文件扩展名和命名规则
        String obj;
        if ("drc".equalsIgnoreCase(format)) {
            // DRC文件有多种命名规则，优先尝试qp14版本
            String[] dracoPatterns = {
                "data_" + quality + "_qp14.drc",      // data_refined_qp14.drc
                "data_" + quality + "_qp10.drc",      // data_refined_qp10.drc
                "data_" + quality + "_qp7.drc",       // data_refined_qp7.drc
                "data_" + quality + ".drc"            // data_refined.drc
            };
            // 使用第一个模式作为默认，实际查找会在SmbFileService中处理
            obj = dracoPatterns[0];
        } else {
            String extension = ".obj";
            obj = "mc".equalsIgnoreCase(quality) ? "data_mc" + extension : "data_refined" + extension;
        }
        
        String cleanBase = base.endsWith("/") ? base.substring(0, base.length() - 1) : base;
        // 使用原始ID（不补0）作为文件名
        return String.format("%s/results/%s/%s.swc/%s", cleanBase, group, id, obj);
    }

    private String buildRemoteUrlWithPattern(String base, String id, String fileName) {
        // 将ID转换为数字，然后格式化为6位数字（不足6位前面补0）
        int idNum;
        try {
            idNum = Integer.parseInt(id);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("ID格式无效: " + id);
        }
        
        // 格式化为6位数字，不足6位前面补0（用于查找目录）
        String formattedId = String.format("%06d", idNum);
        String group = formattedId.substring(0, 3);
        
        String cleanBase = base.endsWith("/") ? base.substring(0, base.length() - 1) : base;
        // 使用原始ID（不补0）作为文件名
        return String.format("%s/results/%s/%s.swc/%s", cleanBase, group, id, fileName);
    }

    @GetMapping("/mesh/{id}")
    public ResponseEntity<byte[]> proxyMesh(
            @PathVariable("id") String id,
            @RequestParam(value = "quality", required = false, defaultValue = "refined") String quality,
            @RequestParam(value = "format", required = false, defaultValue = "obj") String format,
            @RequestParam(value = "base", required = false) String base
    ) {
        String b = (base == null || base.isBlank()) ? defaultRemoteBase : base;

        byte[] data = null;
        String usedUrl = null;
        
        // 首先尝试从本地文件系统读取
        try {
            if ("drc".equalsIgnoreCase(format)) {
                data = smbFileService.readDraco(id, quality);
            } else {
                data = smbFileService.readObj(id, quality);
            }
        } catch (Exception ignore) {}

        // 如果本地读取失败，尝试从远程URL读取
        if (data == null) {
            RestTemplate rt = new RestTemplate();
            String[] order = "mc".equalsIgnoreCase(quality)
                    ? new String[]{"mc", "refined"}
                    : new String[]{"refined", "mc"};
            
            for (String q : order) {
                if ("drc".equalsIgnoreCase(format)) {
                    // DRC文件尝试多种命名规则
                    String[] dracoPatterns = {
                        "data_" + q + "_qp14.drc",
                        "data_" + q + "_qp10.drc", 
                        "data_" + q + "_qp7.drc",
                        "data_" + q + ".drc"
                    };
                    
                    for (String pattern : dracoPatterns) {
                        String url = buildRemoteUrlWithPattern(b, id, pattern);
                        try {
                            data = rt.getForObject(url, byte[].class);
                            if (data != null && data.length > 0) { 
                                usedUrl = url; 
                                break; 
                            }
                        } catch (RestClientException ex) {
                            // try next pattern
                        }
                    }
                    if (data != null) break;
                } else {
                    // OBJ文件使用原有逻辑
                    String url = buildRemoteUrl(b, id, q, format);
                    try {
                        data = rt.getForObject(url, byte[].class);
                        if (data != null && data.length > 0) { 
                            usedUrl = url; 
                            break; 
                        }
                    } catch (RestClientException ex) {
                        // try next
                    }
                }
            }
        }

        if (data == null) {
            String fileType = "drc".equalsIgnoreCase(format) ? "DRC" : "OBJ";
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .contentType(MediaType.TEXT_PLAIN)
                    .body((fileType + " not found for id=" + id).getBytes());
        }

        HttpHeaders headers = new HttpHeaders();
        // 根据format参数设置正确的Content-Type
        if ("drc".equalsIgnoreCase(format)) {
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        } else {
            headers.setContentType(MediaType.TEXT_PLAIN);
        }
        headers.add(HttpHeaders.CACHE_CONTROL, "public, max-age=86400");
        if (usedUrl != null) {
            headers.add("X-Source-Url", usedUrl);
        }
        return new ResponseEntity<>(data, headers, HttpStatus.OK);
    }
}


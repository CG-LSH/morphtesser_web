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
import org.springframework.web.client.RestTemplate;

import com.morphtesser.service.SmbFileService;
import org.springframework.beans.factory.annotation.Autowired;

@RestController
@RequestMapping("/api/embed")
public class EmbedController {

    private static final String DEFAULT_BASE = "http://10.6.51.163:5000/shared/morphtesser_exp/neuromorpho_08";

    @Autowired
    private SmbFileService smbFileService;

    private String buildRemoteUrl(String base, String id, String quality) {
        String idStr = String.valueOf(id);
        String group = idStr.length() > 3 ? idStr.substring(0, 3) : idStr;
        String obj = "mc".equalsIgnoreCase(quality) ? "data_mc.obj" : "data_refined.obj";
        String cleanBase = base.endsWith("/") ? base.substring(0, base.length() - 1) : base;
        return String.format("%s/results/%s/%s.swc/%s", cleanBase, group, idStr, obj);
    }

    @GetMapping("/mesh/{id}")
    public ResponseEntity<byte[]> proxyMesh(
            @PathVariable("id") String id,
            @RequestParam(value = "quality", required = false, defaultValue = "refined") String quality,
            @RequestParam(value = "base", required = false) String base
    ) {
        String b = (base == null || base.isBlank()) ? DEFAULT_BASE : base;

        byte[] data = null;
        String usedUrl = null;
        try {
            data = smbFileService.readObj(id, quality);
        } catch (Exception ignore) {}

        if (data == null) {
            RestTemplate rt = new RestTemplate();
            String[] order = "mc".equalsIgnoreCase(quality)
                    ? new String[]{"mc", "refined"}
                    : new String[]{"refined", "mc"};
            for (String q : order) {
                String url = buildRemoteUrl(b, id, q);
                try {
                    data = rt.getForObject(url, byte[].class);
                    if (data != null && data.length > 0) { usedUrl = url; break; }
                } catch (RestClientException ex) {
                    // try next
                }
            }
        }

        if (data == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .contentType(MediaType.TEXT_PLAIN)
                    .body(("OBJ not found for id=" + id).getBytes());
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.TEXT_PLAIN);
        headers.add(HttpHeaders.CACHE_CONTROL, "public, max-age=86400");
        headers.add("X-Source-Url", usedUrl);
        return new ResponseEntity<>(data, headers, HttpStatus.OK);
    }
}


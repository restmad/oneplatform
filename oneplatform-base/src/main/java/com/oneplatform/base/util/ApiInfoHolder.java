/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.oneplatform.base.util;

import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.List;

import org.apache.commons.lang3.StringUtils;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.core.io.support.ResourcePatternResolver;
import org.springframework.core.type.classreading.CachingMetadataReaderFactory;
import org.springframework.core.type.classreading.MetadataReader;
import org.springframework.core.type.classreading.MetadataReaderFactory;
import org.springframework.stereotype.Controller;
import org.springframework.util.ClassUtils;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.oneplatform.base.model.ApiInfo;

import io.swagger.annotations.ApiOperation;

/**
 * @description <br>
 * @author <a href="mailto:vakinge@gmail.com">vakin</a>
 * @date 2018年4月17日
 */
public class ApiInfoHolder {

	private static List<ApiInfo> apiInfos = new ArrayList<>();
	
	private synchronized static void scanApiInfos() {

		if (!apiInfos.isEmpty())
			return;

		String classPattern = "/**/*.class";
		String[] parts = StringUtils.split(ApiInfoHolder.class.getPackage().getName(),".");
		String scanBasePackage = System.getProperty("controller.base-package", parts[0] + "." + parts[1]);
		ResourcePatternResolver resourcePatternResolver = new PathMatchingResourcePatternResolver();

		try {
			String pattern = ResourcePatternResolver.CLASSPATH_ALL_URL_PREFIX
					+ ClassUtils.convertClassNameToResourcePath(scanBasePackage) + classPattern;
			org.springframework.core.io.Resource[] resources = resourcePatternResolver.getResources(pattern);
			MetadataReaderFactory readerFactory = new CachingMetadataReaderFactory(resourcePatternResolver);

			Method[] methods;
			String baseUri;
			ApiInfo apiInfo;
			for (org.springframework.core.io.Resource resource : resources) {
				if (resource.isReadable()) {
					MetadataReader reader = readerFactory.getMetadataReader(resource);
					String className = reader.getClassMetadata().getClassName();
					Class<?> clazz = Class.forName(className);
					if (clazz.isAnnotationPresent(Controller.class)
							|| clazz.isAnnotationPresent(RestController.class)) {
						if (clazz.isAnnotationPresent(RequestMapping.class)) {
							baseUri = clazz.getAnnotation(RequestMapping.class).value()[0];
							if (!baseUri.startsWith("/"))
								baseUri = "/" + baseUri;
							if (baseUri.endsWith("/"))
								baseUri = baseUri.substring(0, baseUri.length() - 1);
						} else {
							baseUri = "";
						}
						methods = clazz.getDeclaredMethods();
						methodLoop: for (Method method : methods) {
							if (!method.isAnnotationPresent(RequestMapping.class))
								continue methodLoop;
							RequestMapping annotation = method.getAnnotation(RequestMapping.class);
							apiInfo = new ApiInfo();
							String methodUri = annotation.value()[0];
							if (!methodUri.startsWith("/"))
								methodUri = "/" + methodUri;
							apiInfo.setUrl(baseUri + methodUri);
							if (annotation.method() != null && annotation.method().length > 0) {
								apiInfo.setMethod(annotation.method()[0].name());
							}
							if (method.isAnnotationPresent(ApiOperation.class)) {
								apiInfo.setName(method.getAnnotation(ApiOperation.class).value());
							} else {
								apiInfo.setName(apiInfo.getUrl());
							}
							
							apiInfo.setKey(clazz.getName() + "." + method.getName());

							apiInfos.add(apiInfo);
						}
					}
				}
			}
		} catch (Exception e) {
		}

	}
	
	public static List<ApiInfo> getApiInfos() {
		if (apiInfos.isEmpty()) {
			scanApiInfos();
		}
		return apiInfos;
	}

}

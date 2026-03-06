package com.skillbeacon.controller;

import com.skillbeacon.model.Course;
import com.skillbeacon.model.Job;
import com.skillbeacon.repository.CourseRepository;
import com.skillbeacon.repository.JobRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/data")
@RequiredArgsConstructor
public class DataController {

    private final JobRepository jobRepository;
    private final CourseRepository courseRepository;

    @GetMapping("/jobs")
    public Page<Job> getJobs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String search) {

        PageRequest pr = PageRequest.of(page, size);
        if (city != null && !city.isEmpty()) {
            return jobRepository.findByLocationCityContainingIgnoreCase(city, pr);
        }
        if (search != null && !search.isEmpty()) {
            return jobRepository.searchByTitle(search, pr);
        }
        return jobRepository.findAll(pr);
    }

    @GetMapping("/courses")
    public Page<Course> getCourses(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String platform) {

        PageRequest pr = PageRequest.of(page, size);
        if (platform != null && !platform.isEmpty()) {
            return courseRepository.findByPlatformIgnoreCase(platform, pr);
        }
        return courseRepository.findAll(pr);
    }
}

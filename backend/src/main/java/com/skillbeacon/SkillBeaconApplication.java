package com.skillbeacon;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SkillBeaconApplication {

    public static void main(String[] args) {
        SpringApplication.run(SkillBeaconApplication.class, args);
    }
}

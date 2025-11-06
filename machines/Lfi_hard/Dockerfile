# Dockerfile for Hard LFI Challenge
FROM php:8.1-apache

# Install necessary packages
RUN apt-get update && apt-get install -y \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*


COPY . /var/www/html/

RUN mkdir -p /etc/challenge/

ARG LFI_FLAG
RUN echo "This is the final flag file." > /etc/challenge/secret_config.ini
RUN echo "The flag is: ${LFI_FLAG}" >> /etc/challenge/secret_config.ini

RUN chown -R www-data:www-data /var/www/html

RUN chown www-data:root /etc/challenge/secret_config.ini
RUN chmod 440 /etc/challenge/secret_config.ini

EXPOSE 80